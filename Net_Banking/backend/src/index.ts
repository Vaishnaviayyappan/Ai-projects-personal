import express from 'express';
import session from 'express-session';
import { authRouter } from './routes/auth';
import { transferRouter } from './routes/transfer';
import { accountsRouter } from './routes/accounts';
import { transactionsRouter } from './routes/transactions';
import { beneficiariesRouter } from './routes/beneficiaries';
import { statementRouter } from './routes/statement';
import { limitsRouter } from './routes/limits';
import { auditRouter } from './routes/audit';
import { testRouter } from './routes/test';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? 'netbank-poc-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60,
    },
  }),
);

app.use('/api', authRouter);
app.use('/api', transferRouter);
app.use('/api', accountsRouter);
app.use('/api', transactionsRouter);
app.use('/api', beneficiariesRouter);
app.use('/api', statementRouter);
app.use('/api', limitsRouter);
app.use('/api', auditRouter);

if (process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_ENDPOINTS === '1') {
  app.use('/api', testRouter);
}

app.listen(PORT, () => {
  console.log(`netbank backend listening on port ${PORT}`);
});
