export type SessionTicket = Readonly<{ uid: string; epoch: number; legalRevision: number }>

/** Prevents asynchronous reads/writes from applying to a later account or legal write. */
export class SessionGuard {
  private uid: string | null = null
  private epoch = 0
  private legalRevision = 0

  transition(uid: string | null) {
    if (this.uid === uid) return false
    this.uid = uid
    this.epoch += 1
    this.legalRevision += 1
    return true
  }

  reset() {
    this.uid = null
    this.epoch += 1
    this.legalRevision += 1
  }

  capture(uid: string): SessionTicket {
    return { uid, epoch: this.epoch, legalRevision: this.legalRevision }
  }

  matches(ticket: SessionTicket, checkLegalRevision = false) {
    return this.uid === ticket.uid && this.epoch === ticket.epoch
      && (!checkLegalRevision || this.legalRevision === ticket.legalRevision)
  }

  beginLegalWrite(uid: string) {
    this.legalRevision += 1
    return this.capture(uid)
  }

  finishLegalWrite(ticket: SessionTicket) {
    if (!this.matches(ticket)) return false
    // Invalidate reads that started either before or during the write.
    this.legalRevision += 1
    return true
  }
}
