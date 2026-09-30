# Roles, Permissions & Data Isolation Matrix

## 1. System Roles Hierarchy

The platform implements Role-Based Access Control (RBAC) combined with Attribute-Based Access Control (ABAC) for ownership verification.

```
       [SUPER_ADMIN]
             │
          [ADMIN]
     ┌───────┼──────────┬──────────────┐
     │       │          │              │
  [AGENT] [DESIGNER] [PRODUCTION]  [CUSTOMER]
```

### Role Definitions
1. **SUPER_ADMIN**: Full system control, role assignment, system credentials, brand configuration, audit log inspection, and destructive database operations.
2. **ADMIN**: Operational management across orders, catalog, inventory, campaigns, agent allocations, pricing approvals, and business analytics.
3. **AGENT**: Sales consultants and CRM handlers. Manage assigned leads, communicate with customers, log sales activities, and assist custom design requests.
4. **DESIGNER**: Haute couture design team. Review custom design requests, analyze customer inspiration images, select craft & fabric specifications, and prepare itemized quotations and revisions.
5. **PRODUCTION**: Atelier workshop, master cutters, tailors, embroiderers, and quality control inspectors. Update manufacturing job statuses, attach WIP photos, verify QC checklists.
6. **CUSTOMER**: Verified buyers. Browse products, submit custom design requests, upload inspiration files, review and negotiate quotes, make payments, and track garments in production.

---

## 2. Resource Permissions Matrix

| Resource / Action | SUPER_ADMIN | ADMIN | AGENT | DESIGNER | PRODUCTION | CUSTOMER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Brand Configuration** | CRUD | CRUD | R | R | R | R |
| **Catalog (Products/Fabrics/Crafts)** | CRUD | CRUD | R | CRUD | R | R |
| **Customer Sizing & Profiles** | CRUD | CRUD | R (Assigned) | R (Assigned) | R (Assigned Jobs) | CRUD (Self Only) |
| **Inspiration Files & Uploads** | CRUD | CRUD | R (Assigned) | CRUD (Assigned) | R (Job Specs) | CRUD (Self Only) |
| **Custom Design Requests** | CRUD | CRUD | RU (Assigned) | RU (Assigned) | R (Spec only) | CRUD (Self Only) |
| **Quotation Authoring (V1, V2...)** | CRUD | CRUD | R (Assigned) | CRUD (Assigned) | - | R (Self Only) |
| **Quotation Accept / Request Change**| Override | Override | - | - | - | U (Self Only) |
| **Order Management** | CRUD | CRUD | R (Assigned) | R (Assigned) | R (Production) | R (Self Only) |
| **Payments & Transactions** | CRUD | CRUD | - | - | - | U (Pay Self) |
| **Production Jobs & WIP Photos** | CRUD | CRUD | R (Status) | R (Status) | CRUD | R (Status Only) |
| **Quality Control (QC)** | CRUD | CRUD | - | R | CRUD | R (Certificate) |
| **Leads & Pipeline Activities** | CRUD | CRUD | CRUD (Assigned) | - | - | - |
| **Marketing Campaigns** | CRUD | CRUD | R | - | - | - |
| **Audit Logs & System Health** | CRUD | R | - | - | - | - |

*Legend: C = Create, R = Read, U = Update, D = Delete*

---

## 3. Strict Data Boundary & Isolation Rules

### 3.1 Customer Isolation Boundary (Zero Leaks)
1. **Row-Level Tenancy Filter**:
   Every database query initiated by a `CUSTOMER` role is automatically scoped with `WHERE customer_id = :currentUser.id`.
2. **Access Prohibitions**:
   A customer can **NEVER** view or query:
   - Another customer's personal profile, measurements, or delivery addresses.
   - Another customer's design inspiration uploads or sketches.
   - Quotation margins, internal designer notes, or cost calculations.
   - Production internal notes or worker assignees.
3. **Signed Object URLs**:
   S3 file URLs are generated with short-lived (15 minutes) HMAC signatures only after verifying that the requesting user owns the custom design request.

### 3.2 Agent Isolation Boundary
1. Agents can **only** query leads and customer communications assigned to their `user_id`.
2. Attempts to query unassigned leads return `403 Forbidden` unless the user possesses the `LEAD_VIEW_ALL` administrative permission.
3. Reassigning a lead to another agent requires `ADMIN` privileges.

### 3.3 Designer Isolation Boundary
1. Designers have access to assigned `custom_design_requests` and associated uploaded images, sizing, and craft preferences.
2. Designers cannot view customer credit card details, payment transaction credentials, or unassigned marketing leads.
3. Designers have write access to author new quotation versions (`V1`, `V2`, `V3`), but cannot alter or delete previously sent historical quotes.

### 3.4 Production Isolation Boundary
1. Production atelier staff access `production_jobs` and their technical specifications (measurements sheet, fabric swatch ID, craft type, design sketches).
2. Production staff **do not** have access to customer billing information, quotation profit margins, or marketing lead pipelines.

---

## 4. Implementation in NestJS (Guards & Decorators)

### 4.1 Role Guard & Custom Decorator
```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from './roles.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new UnauthorizedException('Authentication required');
    
    if (user.role === UserRole.SUPER_ADMIN) return true;
    return requiredRoles.includes(user.role);
  }
}
```

### 4.2 Resource Ownership Guard (ABAC)
```typescript
// custom-request-owner.guard.ts
@Injectable()
export class CustomRequestOwnerGuard implements CanActivate {
  constructor(private customRequestService: CustomRequestService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requestId = request.params.id;

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const designRequest = await this.customRequestService.findById(requestId);
    if (!designRequest) {
      throw new NotFoundException('Custom design request not found');
    }

    if (user.role === UserRole.CUSTOMER) {
      if (designRequest.customerId !== user.id) {
        throw new ForbiddenException('Access denied to this design request');
      }
      return true;
    }

    if (user.role === UserRole.AGENT) {
      if (designRequest.assignedAgentId !== user.id) {
        throw new ForbiddenException('You are not the assigned agent for this request');
      }
      return true;
    }

    if (user.role === UserRole.DESIGNER) {
      if (designRequest.assignedDesignerId !== user.id) {
        throw new ForbiddenException('You are not the assigned designer for this request');
      }
      return true;
    }

    return false;
  }
}
```
