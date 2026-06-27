import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import {
  CreateLoanRequestDto,
  ProcessLoanRequestDto,
  RecordManualPaymentDto,
} from './dto/loans.dto';

@ApiTags('Loans & Salary Advances')
@ApiBearerAuth()
@Controller('loans')
export class LoansController {
  constructor(private readonly service: LoansService) {}

  @Get()
  @ApiOperation({ summary: 'Get loans ledger list' })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  async getLoans(@Req() req: any, @Query('employeeId') employeeId?: string) {
    const userId = req.user.id;
    const permissions = req.user.permissions ? Array.from(req.user.permissions) : [];

    const isAdmin = permissions.includes('salary:read') ||
                    permissions.includes('payroll:read') ||
                    permissions.includes('salary:view_all') ||
                    permissions.includes('salary:view_team');

    const targetId = isAdmin ? employeeId : userId;
    return this.service.getLoans(targetId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific loan request & repayment ledger' })
  async getLoanDetails(@Param('id') id: string) {
    return this.service.getLoanDetails(id);
  }

  @Post()
  @ApiOperation({ summary: 'Apply for a loan or salary advance' })
  async applyForLoan(
    @Req() req: any,
    @Body() dto: CreateLoanRequestDto,
  ) {
    const employeeId = req.user.id;
    return this.service.createLoanRequest(employeeId, Number(dto.amount), Number(dto.termMonths), dto.reason);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Approve or reject a loan request' })
  async processLoanRequest(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: ProcessLoanRequestDto,
  ) {
    const actionByUserId = req.user.id;
    return this.service.processLoanRequest(id, dto.status, dto.remarks || '', actionByUserId);
  }

  @Post(':id/disburse')
  @ApiOperation({ summary: 'Disburse an approved loan request' })
  async disburseLoan(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const actionByUserId = req.user.id;
    return this.service.disburseLoan(id, actionByUserId);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Manually record a loan installment/repayment' })
  async recordManualPayment(
    @Param('id') id: string,
    @Body() dto: RecordManualPaymentDto,
  ) {
    return this.service.recordPayment(id, Number(dto.amount), dto.paymentMethod, dto.remarks);
  }
}
