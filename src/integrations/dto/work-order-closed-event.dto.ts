import { Type } from 'class-transformer';
import { Equals, IsDateString, IsString, MaxLength, ValidateNested } from 'class-validator';

class IncidentReferenceDto {
  @IsString()
  @MaxLength(128)
  externalId: string;

  @IsString()
  @MaxLength(64)
  code: string;
}

class WorkOrderReferenceDto {
  @IsString()
  id: string;

  @IsString()
  @MaxLength(64)
  code: string;

  @Equals('CLOSED')
  status: 'CLOSED';

  @IsString()
  @MaxLength(4000)
  finalDiagnosis: string;

  @IsString()
  @MaxLength(4000)
  solutionApplied: string;

  @IsDateString()
  closedAt: string;
}

export class WorkOrderClosedEventDto {
  @Equals('work-order.closed')
  eventType: 'work-order.closed';

  @IsDateString()
  occurredAt: string;

  @ValidateNested()
  @Type(() => IncidentReferenceDto)
  incident: IncidentReferenceDto;

  @ValidateNested()
  @Type(() => WorkOrderReferenceDto)
  workOrder: WorkOrderReferenceDto;
}
