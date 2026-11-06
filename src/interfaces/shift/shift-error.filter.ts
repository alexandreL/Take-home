import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common'
import type { Response } from 'express'
import { AgentNotAvailableError } from '../../domain/shift/agent-not-available.error'
import { AgentNotFoundError } from '../../domain/shift/agent-not-found.error'
import { ShiftFullError } from '../../domain/shift/shift-full.error'
import { ShiftNotFoundError } from '../../domain/shift/shift-not-found.error'

/** Translates the shift domain errors into HTTP status codes. */
@Catch(ShiftNotFoundError, AgentNotFoundError, AgentNotAvailableError, ShiftFullError)
export class ShiftErrorFilter implements ExceptionFilter<Error> {
    catch(error: Error, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<Response>()
        const statusCode = httpStatusFor(error)

        response.status(statusCode).json({
            statusCode,
            message: error.message,
        })
    }
}

function httpStatusFor(error: Error): number {
    if (error instanceof ShiftFullError) {
        return 409
    }

    if (error instanceof AgentNotAvailableError) {
        return 422
    }

    return 404
}
