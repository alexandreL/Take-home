export class ShiftNotFoundError extends Error {
    readonly shiftId: string

    constructor(shiftId: string) {
        super(`Shift ${shiftId} not found`)
        this.name = 'ShiftNotFoundError'
        this.shiftId = shiftId
    }
}
