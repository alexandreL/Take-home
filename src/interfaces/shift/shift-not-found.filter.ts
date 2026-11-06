import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import type { Response } from 'express'
import { ShiftNotFoundError } from '../../domain/shift/shift-not-found.error.js'

/** Translates the domain error into HTTP: a missing shift is a 404. */
@Catch(ShiftNotFoundError)
export class ShiftNotFoundFilter implements ExceptionFilter<ShiftNotFoundError> {
    catch(error: ShiftNotFoundError, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>()

        response.status(404).json({
            statusCode: 404,
            message: error.message,
        })
    }
}
