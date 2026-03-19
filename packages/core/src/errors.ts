export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class DomainNotFoundError extends DomainError {}

export class DomainRuleError extends DomainError {}
