import { WithAuth } from "../lib/authutils";
import Projects from "./projects/projects";

import PageTitle from '../components/page-title';
import { getAuthUser } from "../lib/data/api";
const Dashboard = () => {

  const user = getAuthUser()
  return (
    <>
      <div className="mb-6">
      <strong className="text-xl">Welcome {user?.full_name}</strong>
        <PageTitle title={'My Audits'} />
       
      </div>
      <div className="w-full">
        
        <div className="w-full">
          <Projects pageTitle='' embedded={true} mine={true} />
        </div>
      </div>
    </>
  );
};


export default WithAuth(Dashboard);