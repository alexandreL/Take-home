import type { Qualification } from './qualification.model.js'

export interface Agent {
    id: string
    name: string
    qualifications: Qualification[]
}
