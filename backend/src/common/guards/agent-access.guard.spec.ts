import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AgentAccessGuard } from './agent-access.guard';

describe('AgentAccessGuard (Agent Lead Access Restrictions)', () => {
  let guard: AgentAccessGuard;
  let prismaService: any;

  beforeEach(() => {
    prismaService = {
      lead: {
        findUnique: jest.fn(),
      },
    };
    guard = new AgentAccessGuard(prismaService);
  });

  const createMockContext = (user: any, params: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    }) as any;

  it('should allow agent to access lead assigned directly to them', async () => {
    prismaService.lead.findUnique.mockResolvedValue({
      id: 'lead-1',
      assignedAgentId: 'agent-fatima',
    });

    const context = createMockContext(
      { id: 'agent-fatima', role: UserRole.AGENT },
      { id: 'lead-1' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw ForbiddenException if agent tries to access unassigned lead', async () => {
    prismaService.lead.findUnique.mockResolvedValue({
      id: 'lead-2',
      assignedAgentId: 'agent-other', // Assigned to someone else!
    });

    const context = createMockContext(
      { id: 'agent-fatima', role: UserRole.AGENT },
      { id: 'lead-2' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow ADMIN to access any lead', async () => {
    const context = createMockContext(
      { id: 'admin-1', role: UserRole.ADMIN },
      { id: 'lead-2' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw NotFoundException if lead does not exist', async () => {
    prismaService.lead.findUnique.mockResolvedValue(null);

    const context = createMockContext(
      { id: 'agent-fatima', role: UserRole.AGENT },
      { id: 'non-existent-lead' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });
});
