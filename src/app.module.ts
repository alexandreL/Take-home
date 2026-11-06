import { Module } from '@nestjs/common'
import { ShiftModule } from './interfaces/shift/shift.module'

@Module({
    imports: [ShiftModule],
})
export class AppModule {}
