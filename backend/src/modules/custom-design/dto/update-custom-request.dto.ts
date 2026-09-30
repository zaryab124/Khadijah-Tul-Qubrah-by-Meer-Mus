import { PartialType } from '@nestjs/swagger';
import { CreateCustomRequestDto } from './create-custom-request.dto';

export class UpdateCustomRequestDto extends PartialType(CreateCustomRequestDto) {}
