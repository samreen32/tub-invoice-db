import React from 'react';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

function InvoiceFilters({ selectedYear, selectedMonth, showUncreatedInvoices, handleYearChange, handleMonthChange, handleToggleUncreatedInvoices }) {
    return (
        <div>
            <Select
                value={selectedYear}
                onChange={handleYearChange}
                style={{ marginLeft: "20px", marginRight: "10px", marginTop: "20px" }}
                displayEmpty
            >
                <MenuItem value="">All Years... </MenuItem>
                {Array.from(
                    { length: 10 },
                    (_, index) => new Date().getFullYear() - index
                ).map((year) => (
                    <MenuItem key={year} value={year.toString()}>
                        {year}
                    </MenuItem>
                ))}
            </Select>

            <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                style={{ marginRight: "20px", marginTop: "20px" }}
                displayEmpty
            >
                <MenuItem value="">All Months... </MenuItem>
                {months.map((month) => (
                    <MenuItem key={month} value={month}>
                        {month}
                    </MenuItem>
                ))}
            </Select>

            <ToggleButtonGroup
                value={showUncreatedInvoices}
                exclusive
                onChange={handleToggleUncreatedInvoices}
                aria-label="Show uncreated invoices"
                style={{ marginRight: "20px", marginTop: "20px" }}
            >
                <ToggleButton value={true} aria-label="show uncreated">
                    Invoice Reports
                </ToggleButton>
                <ToggleButton value={false} aria-label="show all">
                    All Reports
                </ToggleButton>
            </ToggleButtonGroup>
        </div>
    );
}

export default InvoiceFilters;
