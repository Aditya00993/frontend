import { useEffect, useState, useContext } from 'react';
import { ThemeContext } from '../../layouts/layout';
import { useNavigate, useLocation } from "react-router-dom";
import { fetchFilteredProjects, fetchMyProjects, deleteProjects } from "../../lib/data/api";
import { toast } from 'react-hot-toast';
import PageTitle from '../../components/page-title';
import { Link } from 'react-router-dom';
import { WithAuth } from "../../lib/authutils";
import { currentUserCan, getProjectStatusColor } from "../../lib/utilities";
import { useDataReducer } from '../../lib/useDataReducer';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Project, Column, FilteredSet } from '../../lib/data/definitions';
import { DatasetState, DatasetAction, DEFAULT_DATA_LIMIT } from '../../lib/useDataReducer';
import DataTable from 'react-data-table-component';
import Button from '../../components/button';
import { HeaderFilter, ClearFilter } from "../../components/headerFilter";
import { RowsSkeleton } from '../../components/skeletons';
import ErrorPage from '../../pages/error-page';
import useCustomStyles from '../../components/tableStyle';


export interface ProjectsProps {
  pageTitle: string;
  embedded?: boolean;
  mine?: boolean;
  refresh?: boolean | undefined;
  onClear?: () => void;
}

interface ProjectWithActions extends Project {
  actions: JSX.Element;
}

export function Projects(props: ProjectsProps): JSX.Element {
  const initialState: DatasetState = {
    mode: 'idle',
    data: [],
    queryParams: { offset: 0, limit: DEFAULT_DATA_LIMIT },
    totalRows: 0
  };

  const params = new URLSearchParams(window.location.search);
  const search = params.get('name') || '';
  const canEdit = currentUserCan('Manage Users');
  const theme = useContext(ThemeContext);
  const customStyles = useCustomStyles(theme);

  if (search) {
    initialState.queryParams = { offset: 0, limit: DEFAULT_DATA_LIMIT, name: search };
  }

  function formatDataActions(data: any): ProjectWithActions[] {
    if (!data) return [];
    const formatted: ProjectWithActions[] = [];
    data.forEach((row: ProjectWithActions) => {
      row.actions = (
        <>
          <Link to={`/projects/${row.id}/edit`}><PencilSquareIcon className="inline w-5" /></Link>
          <TrashIcon className="inline w-5 ml-1 cursor-pointer" onClick={() => handleDelete([row.id])} />
        </>
      );
      formatted.push(row);
    });
    return formatted;
  }

  const reducer = (state: DatasetState, action: DatasetAction): DatasetState | void => {
    switch (action.type) {
      case 'set-search': {
        if (state.queryParams.name === action.payload) return state;
        let newQueryParams = { name: action.payload, offset: 0, limit: state.queryParams?.limit || DEFAULT_DATA_LIMIT };
        return { ...state, queryParams: newQueryParams };
      }
    }
  };

  const [state, dispatch] = useDataReducer(reducer, initialState);
  const [selected, setSelected] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const [filterValues, setFilterValues] = useState({
    name: '',
    companyname: '',
    owner: '',
    status: '',
    projecttype: '',
    testingtype: '',
    work_order_received: '',
    enddate_before: '',
    
  });

  const handleSort = (name: string, sortDirection: string) => {
    if (name && sortDirection) {
      dispatch({ type: 'set-sort', payload: { sort: name, order_by: sortDirection as 'asc' | 'desc' } });
      loadData();
    }
  };

  useEffect(() => {
    loadData();
  }, [state.queryParams]);

  const handlePerRowsChange = (newPerPage: number) => {
    dispatch({ type: 'set-rows-per-page', payload: newPerPage });
  };

  function handlePageChange(page: number) {
    dispatch({ type: 'set-page', payload: page });
  }

  const loadData = async () => {
    try {
      dispatch({ type: 'set-mode', payload: 'loading' });
      let data: FilteredSet;
      if (props.mine) {
        data = await fetchMyProjects();
        dispatch({ type: 'set-data', payload: { data } });
      } else {
        data = await fetchFilteredProjects(state.queryParams);
        dispatch({ type: 'set-data', payload: { data } });
      }
    } catch (error) {
      console.error(error);
      toast.error(error as string);
      dispatch({ type: 'set-error', payload: error });
    } finally {
      dispatch({ type: 'set-mode', payload: 'idle' });
    }
  };

  const onRowClicked = (row: any) => navigate(`/projects/${row.id}`);

  const handleFilter = (event: any) => {
    const { name, value } = event.target;
    setFilterValues((prevFilterValues) => ({
      ...prevFilterValues,
      [name]: value,
    }));
  };

  const clearFilter = () => {
    setFilterValues({
      name: '',
      companyname: '',
      owner: '',
      status: '',
      projecttype: '',
      work_order_received: '', 
      enddate_before: '',
      testingtype: '',
      
    });
    dispatch({ type: 'reset' });
  };

  const filterCommit = () => {
    dispatch({ type: 'set-filter', payload: filterValues });
  };

  const columns: Column[] = [
    ...(canEdit ? [{
      name: 'Action',
      selector: (row: any) => row.actions,
      maxWidth: '1rem',
      omit: props.embedded,
    }] : []),
    {
      name: props.mine ? 'Auditee no' :
        <HeaderFilter label='Auditee no' name='name' defaultValue={filterValues.name}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.id,
      maxWidth: '16rem',
    },
    {
      name: props.mine ? 'Contact Person' :
        <HeaderFilter label='Contact Person' name='name' defaultValue={filterValues.name}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.contact_person_name,
      maxWidth: '16rem',
    },
    
    {
      name: props.mine ? 'Phone No' :
        <HeaderFilter label='Phone No' name='HashValue Received' defaultValue={filterValues.companyname}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
       selector: (row: Project) => row.contact_person_phone,
       maxWidth: '16rem',
     },

  
    {
      name: props.mine ? 'Audit Organisation' :
        <HeaderFilter label='Audit Orgnisation' name='companyname' defaultValue={filterValues.companyname}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.audit_organisation_name,
      maxWidth: '9rem',
    },
    {
      name: props.mine ? 'Auditee Location' :
        <HeaderFilter label='Audit Location' name='Auditee Location' defaultValue={filterValues.companyname}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.description,
      maxWidth: '9rem',
    },
    {
      name: props.mine ? 'Details of project' :
        <HeaderFilter label='Details of Project' name='companyname' defaultValue={filterValues.companyname}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.website_detail,
      maxWidth: '9rem',
    },

    {
      name: props.mine ? 'Audit Mode' :
        <HeaderFilter label='Audit Mode' name='Audit Mode' defaultValue={filterValues.companyname}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
     selector: (row: Project) => row.audit_mode,
      maxWidth: '16rem',
    },
   // {
     // name: props.mine ? 'Report Submitted' :
      //  <HeaderFilter label='Report Submitted' name='HashValue Received' defaultValue={"YES"}
      //    onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
    //  selector: (row: Project) => "YES",
    //  maxWidth: '16rem',
    //},
   // {
      //name: props.mine ? 'Mail To Cert' :
     //   <HeaderFilter label='Mail to Cert' name='HashValue Received' defaultValue={"YES"}
     //     onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
    //  selector: (row: Project) => "No",
    //  maxWidth: '16rem',
    //},
    {
      name: props.mine ? 'Auditor' :
        <HeaderFilter label='Auditor' name='owner' defaultValue={filterValues.owner}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.owner?.length > 0 ? row.owner.map((owner: string) => owner.trim()).join(', ') : 'none',
      maxWidth: '7rem',
    },
    {
      name: props.mine ? 'Status' :
        <HeaderFilter label='Status' name='status' defaultValue={filterValues.status}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => <span className={getProjectStatusColor(row.status)}>{row.status}</span>,
      maxWidth: '7rem',
    },
    // {
    //   name: props.mine ? 'Audit Type' :
    //     <HeaderFilter label='Audit Type' name='projecttype' defaultValue={filterValues.projecttype}
    //       onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
    //   selector: (row: Project) => row.projecttype,
    // },
    {
      name: props.mine ? 'Testing Type' :
        <HeaderFilter label='Testing Type' name='testingtype' defaultValue={filterValues.testingtype}
          onCommit={filterCommit} onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.testingtype,
    },
    {
      name: props.mine ? 'Work Order Received' :
        <HeaderFilter label='Work Order Received' name='work_order_received' isDate={true}
          defaultValue={filterValues.work_order_received} onCommit={filterCommit}
          onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.startdate, // 🟢 Updated selector
      maxWidth: '7rem',
    },
  
    {
      name: props.mine ? 'Ends' :
        <HeaderFilter label='Ends' name='enddate_before' isDate={true}
          defaultValue={filterValues.enddate_before} onCommit={filterCommit}
          onChange={handleFilter} currentFilter={state.queryParams} handleSort={handleSort} />,
      selector: (row: Project) => row.enddate,
      maxWidth: '7rem',
    },
  ];

  const handleNew = () => navigate('/projects/new');
  const handleNewa = () => navigate('/order');
  const handleDelete = async (ids: any[]) => {
    if (!currentUserCan('Manage Projects')) return;
    if (!confirm('Are you sure?')) return false;
    const count = ids.length;
    try {
      await deleteProjects(ids);
      dispatch({ type: 'reset' });
      toast.success(count === 1 ? 'Project deleted' : `${count} projects deleted`);
      setSelected([]);
    } catch (error) {
      dispatch({ type: 'set-error', payload: error });
    }
  };

  const deleteMultiple = () => handleDelete(selected);
  


  const handleSelectedChange = (event: any) => {
    const ids = event.selectedRows.map((item: any) => item.id);
    setSelected(ids);
  };

  const handleSearch = (term = '') => {
    if (term) {
      dispatch({ type: 'set-search', payload: term });
      const params = new URLSearchParams(window.location.search);
      params.set('name', term);
      navigate(`?${params.toString()}`, { replace: true });
    } else {
      dispatch({ type: 'clear-search' });
      navigate(location.pathname, { replace: true });
    }
  };

  const clearSearch = () => handleSearch('');

  if (state.error) {
    console.error(state.error);
    return <ErrorPage message={state.error} />;
  }

  return (
    <>
      {props.pageTitle && <PageTitle title={props.pageTitle} />}
      <div className="flow-root">
        {currentUserCan('Manage Projects') && !props.embedded &&
          <>
            <Button className='btn bg-primary float-right m-2' onClick={handleNew}>New Audit</Button>
            
            <Button className="btn bg-secondary float-right m-2 mr-0 disabled:opacity-50"
              disabled={selected.length === 0} onClick={deleteMultiple}>
              Delete
            </Button>
            <Button
            className="btn bg-secondary float-right m-2 mr-0 disabled:opacity-50"
            disabled={selected.length === 0}
            onClick={() => navigate('/order', { state: { projectId: selected[0] } })}
            >
            Print Work Order
            </Button>

          </>
        }
        {state.queryParams.name &&
          <p className="mt-8">
            Results for &quot;{state.queryParams.name}&quot;
            <span className="text-xs ml-1">(<span className="underline text-blue-600" onClick={clearSearch}>clear</span>)</span>
          </p>
        }
        <ClearFilter queryParams={state.queryParams} clearFilter={clearFilter} />
        {state.mode === 'loading' && <div className="mt-16"><RowsSkeleton numRows={state.queryParams.limit} /></div>}
        <div className={state.mode !== 'idle' ? 'hidden' : ''}>
          <DataTable
            columns={columns}
            data={formatDataActions(state.data)}
            selectableRows={!props.embedded}
            onRowClicked={onRowClicked}
            progressPending={state.mode !== 'idle'}
            pagination
            paginationServer
            paginationPerPage={state.queryParams.limit}
            onChangeRowsPerPage={handlePerRowsChange}
            onChangePage={handlePageChange}
            paginationTotalRows={state.totalRows}
            striped
            highlightOnHover
            pointerOnHover
            fixedHeader
            onSelectedRowsChange={handleSelectedChange}
            theme={theme}
            customStyles={customStyles}
          />
        </div>
      </div>
    </>
  );
}

export default WithAuth(Projects);
