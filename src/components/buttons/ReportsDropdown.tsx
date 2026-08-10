import React from 'react';
import { BiBarChartAlt, BiListUl, BiNotepad } from 'react-icons/bi';
import IncomeExpenseStatementForm from '../forms/reports/IncomeExpenseStatementForm';
import TransactionReportForm from '../forms/reports/TransactionReportForm';
import FormButton from './FormButton';

export default function ReportsDropdown(): React.JSX.Element {
  return (
    <div className="group relative h-full">
      <button
        type="button"
        className="group-hover:bg-cyan-700/80 dark:group-hover:bg-cyan-600 flex h-full w-full items-center btn btn-primary"
      >
        <BiNotepad className="mr-1" />
        Reports
      </button>
      <ul className="absolute rounded-md w-48 hidden py-2 group-hover:block bg-background-800">
        <li className="text-sm hover:bg-background-700">
          <FormButton
            id="IE report"
            className="flex items-center text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
            modalTitle="Income statement"
            buttonContent={(
              <>
                <BiBarChartAlt className="mr-1" />
                Income Statement
              </>
            )}
          >
            <IncomeExpenseStatementForm />
          </FormButton>
        </li>
        <li className="text-sm hover:bg-background-700">
          <FormButton
            id="TX report"
            className="flex items-center text-left px-3 py-2 w-full text-cyan-700 hover:text-cyan-600 whitespace-nowrap"
            modalTitle="Transaction report"
            buttonContent={(
              <>
                <BiListUl className="mr-1" />
                Transaction Report
              </>
            )}
          >
            <TransactionReportForm />
          </FormButton>
        </li>
      </ul>
    </div>
  );
}
