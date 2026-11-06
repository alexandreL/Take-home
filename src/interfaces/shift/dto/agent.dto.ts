import type { QualificationDto } from './qualification.dto'

/** An agent as exposed by the HTTP API. */
export interface AgentDto {
    id: string
    name: string
    qualifications: QualificationDto[]
}
