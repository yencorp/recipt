import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Event } from "../../entities/event.entity";
import { Budget } from "../../entities/budget.entity";
import { Settlement } from "../../entities/settlement.entity";
import { Organization } from "../../entities/organization.entity";
import { BudgetIncome } from "../../entities/budget-income.entity";
import { BudgetExpense } from "../../entities/budget-expense.entity";
import { SettlementItem, SettlementItemType } from "../../entities/settlement-item.entity";
import { GeneratePDFDto, PDFType } from "./dto/generate-pdf.dto";

@Injectable()
export class PrintService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(Budget)
    private budgetsRepository: Repository<Budget>,
    @InjectRepository(Settlement)
    private settlementsRepository: Repository<Settlement>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(BudgetIncome)
    private budgetIncomesRepository: Repository<BudgetIncome>,
    @InjectRepository(BudgetExpense)
    private budgetExpensesRepository: Repository<BudgetExpense>,
    @InjectRepository(SettlementItem)
    private settlementItemsRepository: Repository<SettlementItem>,
  ) {}

  async getPrintBudgetData(eventId: string, user: any) {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ["organization"],
    });

    if (!event) {
      throw new NotFoundException(`이벤트를 찾을 수 없습니다: ${eventId}`);
    }

    const budget = await this.budgetsRepository.findOne({
      where: { event: { id: eventId } },
      relations: ["event", "event.organization"],
    });

    if (!budget) {
      throw new NotFoundException(
        `해당 이벤트의 예산서를 찾을 수 없습니다: ${eventId}`,
      );
    }

    const incomes = await this.budgetIncomesRepository.find({
      where: { budget: { id: budget.id } },
      order: { displayOrder: "ASC" },
    });

    const expenses = await this.budgetExpensesRepository.find({
      where: { budget: { id: budget.id } },
      order: { displayOrder: "ASC" },
    });

    const totalIncome = incomes.reduce(
      (sum, income) => sum + Number(income.budgetAmount),
      0,
    );
    const totalExpense = expenses.reduce(
      (sum, expense) => sum + Number(expense.budgetAmount),
      0,
    );
    const balance = totalIncome - totalExpense;

    return {
      event,
      organization: event.organization,
      budget,
      incomes,
      expenses,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
      printMetadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        format: "A4",
      },
    };
  }

  async getPrintSettlementData(eventId: string, user: any) {
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
      relations: ["organization"],
    });

    if (!event) {
      throw new NotFoundException(`이벤트를 찾을 수 없습니다: ${eventId}`);
    }

    const settlement = await this.settlementsRepository.findOne({
      where: { event: { id: eventId } },
      relations: ["event", "event.organization"],
    });

    if (!settlement) {
      throw new NotFoundException(
        `해당 이벤트의 결산서를 찾을 수 없습니다: ${eventId}`,
      );
    }

    const items = await this.settlementItemsRepository.find({
      where: { settlement: { id: settlement.id } },
      order: { createdAt: "ASC" },
    });

    const incomes = items.filter((item) => item.type === SettlementItemType.INCOME);
    const expenses = items.filter((item) => item.type === SettlementItemType.EXPENSE);

    const totalIncome = incomes.reduce(
      (sum, income) => sum + Number(income.actualAmount),
      0,
    );
    const totalExpense = expenses.reduce(
      (sum, expense) => sum + Number(expense.actualAmount),
      0,
    );
    const balance = totalIncome - totalExpense;

    return {
      event,
      organization: event.organization,
      settlement,
      incomes,
      expenses,
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
      printMetadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        format: "A4",
      },
    };
  }

  async generatePDF(generatePDFDto: GeneratePDFDto, user: any) {
    const { type, eventId } = generatePDFDto;

    // 이벤트 존재 확인
    const event = await this.eventsRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`이벤트를 찾을 수 없습니다: ${eventId}`);
    }

    // PDF 타입에 따라 데이터 검증
    if (
      type === PDFType.BUDGET ||
      type === PDFType.BUDGET_DETAIL
    ) {
      const budget = await this.budgetsRepository.findOne({
        where: { event: { id: eventId } },
      });
      if (!budget) {
        throw new NotFoundException(
          `해당 이벤트의 예산서를 찾을 수 없습니다: ${eventId}`,
        );
      }
    } else if (
      type === PDFType.SETTLEMENT ||
      type === PDFType.SETTLEMENT_DETAIL
    ) {
      const settlement = await this.settlementsRepository.findOne({
        where: { event: { id: eventId } },
      });
      if (!settlement) {
        throw new NotFoundException(
          `해당 이벤트의 결산서를 찾을 수 없습니다: ${eventId}`,
        );
      }
    }

    // TODO: 실제 PDF 생성 로직은 추후 구현
    // 현재는 mock 응답 반환
    const filename = `${type.toLowerCase()}_${eventId}_${Date.now()}.pdf`;
    const mockUrl = `/files/pdf/${filename}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 후 만료

    return {
      downloadUrl: mockUrl,
      filename,
      size: 0, // TODO: 실제 파일 크기 반환
      expiresAt: expiresAt.toISOString(),
    };
  }
}
