import { ApiProperty } from '@nestjs/swagger';

export class AddBeneficiaries {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
