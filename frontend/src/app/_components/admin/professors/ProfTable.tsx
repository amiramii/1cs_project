"use client"

import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import TableHeader from '../TableHeader';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'User ID', width: 100, headerClassName: 'text-[#1B2065F2] font-bold text-lg' ,cellClassName: 'text-[#1B2065F2]'},
  { field: 'firstName', headerName: 'Name', width: 170, headerClassName: 'text-[#1B2065F2] font-bold text-lg' ,cellClassName: 'text-[#1B2065F2]'},
  { field: 'lastName', headerName: 'Email Address', width: 170, headerClassName: 'text-[#1B2065F2] font-bold text-lg' ,cellClassName: 'text-[#1B2065F2]'},
  { field: 'years', headerName: 'Years Taught', type: 'number', width: 170, headerClassName: 'text-[#1B2065F2] font-bold text-lg' ,cellClassName: 'text-[#51689A]'},
  { field: 'age', headerName: 'Modules Taught', type: 'number', width: 200, headerClassName: 'text-[#1B2065F2] font-bold text-lg' ,cellClassName: 'text-[#74A7BD]'},
  { field: 'absrate', headerName: 'Avg Absense rate', width: 170, headerClassName: 'text-[#1B2065F2] font-bold text-lg' ,cellClassName: 'text-[#1B2065F2]'},

];

const rows = [
  { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
  { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
  { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
  { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
  { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
  { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
  { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
  { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
  { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
];

const paginationModel = { page: 0, pageSize: 5 };

export default function DataTable() {
  return (
    <div className="gap-0">
        <TableHeader/>
        <Paper sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{ pagination: { paginationModel } }}
            pageSizeOptions={[5, 10]}
            checkboxSelection
            sx={{ 
              border: 0,
              // This targets the vertical lines between column headers
              '& .MuiDataGrid-columnSeparator': {
                display: 'none',
              },
              // Optional: If you want to remove the hover effect on the header cells too
              '& .MuiDataGrid-columnHeader:focus-within': {
                outline: 'none',
              },
            }}
          />
        </Paper>
    </div>
  );
}