export interface TransferRequest {
  fromAccount: string;
  toAccount: string;
  amount: number;
  remarks?: string;
}

export interface TransferResponse {
  status: 'Success';
  transactionId: string; // TXN + 5 digits
}

export interface ApiError {
  status: 'Error';
  message: string;
}

// Returned instead of TransferResponse when the amount requires step-up
// authentication (see OTP_THRESHOLD_RUPEES in backend/src/routes/transfer.ts).
export interface OtpRequiredResponse {
  status: 'OtpRequired';
  otpRef: string;
}

export interface OtpConfirmRequest {
  otpRef: string;
  otp: string;
}

export type TransferResult = TransferResponse | OtpRequiredResponse | ApiError;

// TypeScript catches this at compile time, before it ever reaches the API:
//
//   const bad: TransferRequest = {
//     fromAccount: 'SB1001',
//     toAccount: 'CA2001',
//     amount: "10000",
//     remarks: 'Rent',
//   };
//
// Compiler error:
//   Type 'string' is not assignable to type 'number'.
//
// `amount` is typed as `number`, not `string`, specifically so that a value
// like "10000" (a string that looks like money) is rejected at compile time
// instead of silently reaching the transfer API as text.
