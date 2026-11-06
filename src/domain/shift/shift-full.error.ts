export class ShiftFullError extends Error {
    readonly shiftId: string

    constructor(shiftId: string) {
        super(`Shift ${shiftId} is already full`)
        this.name = 'ShiftFullError'
        this.shiftId = shiftId
    }
}
