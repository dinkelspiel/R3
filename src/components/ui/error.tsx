import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import type { ReactNode } from "react";

export const Error = ({ message }: { message: ReactNode }) => (
  <Alert variant="destructive">
    <AlertCircleIcon />
    <AlertTitle>{message}</AlertTitle>
    {/* <AlertDescription>
          <p>Please verify your billing information and try again.</p>
          <ul className="list-inside list-disc text-sm">
            <li>Check your card details</li>
            <li>Ensure sufficient funds</li>
            <li>Verify billing address</li>
          </ul>
        </AlertDescription> */}
  </Alert>
);
