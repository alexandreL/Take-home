import { Module } from '@nestjs/common'
import { ShiftModule } from './shift.module'

@Module({
    imports: [ShiftModule],
})
export class AppModule {}
