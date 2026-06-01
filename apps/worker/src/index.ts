// Worker bootstrap.
// This file is the entry point for the standalone worker service.

export function bootstrap(): string {
  return "worker-bootstrap";
}

if (import.meta.main) {
  console.log(bootstrap());
}
