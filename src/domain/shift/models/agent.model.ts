import type { Qualification } from './qualification.model'

export interface Agent {
    id: string
    name: string
    qualifications: Qualification[]
}
