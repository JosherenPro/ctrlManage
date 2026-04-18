import { ApiProperty } from '@nestjs/swagger';

export class ImportError {
  @ApiProperty()
  row!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  error!: string;
}

export class ImportResultDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  created!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty({ type: [ImportError] })
  errors!: ImportError[];
}