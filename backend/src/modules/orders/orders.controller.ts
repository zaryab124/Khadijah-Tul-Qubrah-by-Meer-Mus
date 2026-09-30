import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Orders, Checkout & Tracking')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary:
      'Place a new order for ready-to-wear / catalog garments (Checks variant stock, creates Order in PENDING_PAYMENT)',
  })
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.createProductOrder(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List orders (Customers see only their own; Admins see all; filterable by status)',
  })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  async listOrders(@Query('status') status: OrderStatus, @Req() req: any) {
    return this.ordersService.listOrders(req.user, status);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get comprehensive order details, items, delivery address, payments, and custom request origin (Customer isolation enforced)',
  })
  async getOrderById(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.getOrderById(id, req.user);
  }

  @Post(':id/pay')
  @ApiOperation({
    summary:
      'Initiate payment for an order via payment provider abstraction (Stripe, Bank Wire, Mock Gateway)',
  })
  async payOrder(
    @Param('id') id: string,
    @Body() dto: PayOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.payOrder(id, req.user, dto);
  }

  @Post(':id/confirm-payment')
  @ApiOperation({
    summary:
      'Confirm and verify payment server-side (Transitions order to PAID, protects against duplicate callbacks)',
  })
  async confirmOrderPayment(
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentDto,
    @Req() req: any,
  ) {
    return this.ordersService.verifyOrderPayment(id, req.user, dto);
  }

  @Get(':id/tracking')
  @ApiOperation({
    summary:
      'Get live luxury order tracking timeline across payment, atelier production stages, QC inspection, and courier dispatch',
  })
  async getOrderTracking(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.getOrderTracking(id, req.user);
  }

  @Post('addresses')
  @ApiOperation({
    summary: 'Save a new delivery address for the customer',
  })
  async createAddress(@Body() dto: CreateAddressDto, @Req() req: any) {
    return this.ordersService.createAddress(req.user.id, dto);
  }

  @Get('addresses')
  @ApiOperation({
    summary: 'List saved delivery addresses for current customer',
  })
  async listAddresses(@Req() req: any) {
    return this.ordersService.listAddresses(req.user.id);
  }
}
