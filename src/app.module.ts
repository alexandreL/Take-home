import { Module } from '@nestjs/common'
import { ShiftModule } from './interfaces/shift/shift.module.js'

@Module({
    imports: [ShiftModule],
})
export class AppModule {}
