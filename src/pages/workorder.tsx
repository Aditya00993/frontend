import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Project } from '../lib/data/definitions';
import { getProject } from '../lib/data/api';
import { WithAuth } from '../lib/authutils';

const Workorder = () => {
  const location = useLocation();
  const projectId = location.state?.projectId;
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!projectId) return;
    getProject(String(projectId)).then(res => setProject(res));
  }, [projectId]);

  const handlePrint = () => window.print();

  if (!project) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6 text-sm">
      <div id="print-area" className="max-w-6xl mx-auto  p-4 bg-white text-black">

        
        <table className="w-full  border-black border-collapse text-left text-sm">
          <tbody>
            {/* Header Section */}
            <tr>
              <td className="border p-2 align-top w-1/2" rowSpan={2}>
                <strong>Audit no.</strong> {project.id}<br />
                <strong>Name(Org):</strong> {project.audit_organisation_name}<br />
                <strong>Scope of Work :-</strong> {project.website_detail}<br />
                <strong>Contact Person: {project.contact_person_name}<br /> </strong>
                <strong>  Phone no: {project.contact_person_phone}<br /> </strong>
                <strong>  Email: {project.contact_person_email} </strong>
              </td>
              <td className="border p-2 align-top" rowSpan={2}>
                Auditor :  {project.owner}<br />
                Verify by:-:{project.verify_by}
              </td>
            </tr>

            {/* Date / Time */}
            <tr>
              {/* Already covered by rowspan */}
            </tr>
            <tr>
              <td className="border p-2 text-center font-semibold">Date / Time: {project.startdate}</td>
              <td className="border p-2 text-center font-semibold">L-1 Submission Date: {project.enddate}</td>
            </tr>

            {/* Steps */}
            <tr>
              <td className="border p-2 font-bold">1. Work Order Received</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">2. Link Working</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold align-top">3. Vulnerabilities / Risk Identified<br></br>in Level 1 Report</td>
              <td className="border p-2">
                <div className="font-bold"></div>
                <div className="text-xs italic pl-2"></div>
                <table className=" w-full border">
                  <tbody>
                    <tr>
                      <td className=" p-1  "> </td>
                      <td className="p-1 flex justify-center items-center">High</td>
                      <td className="border p-1 ">Medium</td>
                      <td className="border p-1">Low</td>
                      <td className="border p-1">Total</td>
                    </tr>
                    <tr>
                      <td className="border p-1">Auditor 1:<br></br>Auditor 2 :</td>
                      <td className="border p-1"></td>
                      <td className="border p-1"></td>
                      <td className="border p-1"></td>
                      <td className="border p-1"></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">4. Verified By <span className="text-xs italic">( Sign & name )</span></td>
              <td className="border p-4"> <br /></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">5.  L1 Report Sent</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">6. Compliance Received</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold align-top">7. Vulnerabilities / Risk Identified    in Level 2 Report</td>
              <td className="border p-2">
                <div className="font-bold"></div>
                <div className="text-xs italic pl-2"></div>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
  <tbody>
    {/* Row 1 */}
    <tr>
      
      <td style={{ border: '1px solid black', fontWeight: 'bold' }}>
        Vulnerabilities / Risk<br />
        Identified<br />
        <span style={{ fontWeight: 'normal', fontSize: 'small' }}>
          in <u>Level 1 Report</u>
        </span>
      </td>
      <td style={{ border: '1px solid black', textAlign: 'center' }}>High</td>
      <td style={{ border: '1px solid black', textAlign: 'center' }}>Medium</td>
      <td style={{ border: '1px solid black', textAlign: 'center' }}>Low</td>
      <td style={{ border: '1px solid black', textAlign: 'center' }}>Total</td>
    </tr>

    {/* Row 2 - Auditor 1 */}
    <tr>
      <td style={{ border: '1px solid black' }}></td>
      <td style={{ border: '1px solid black' }}></td>
      <td style={{ border: '1px solid black' }}>Auditor 1 :</td>
      <td style={{ border: '1px solid black' }}></td>
      <td style={{ border: '1px solid black' }}></td>
      <td style={{ border: '1px solid black' }}></td>
    </tr>

    {/* Row 3 - Auditor 2 */}
    <tr>
      <td style={{ border: '1px solid black' }}></td>
      <td style={{ border: '1px solid black' }}></td>
      <td style={{ border: '1px solid black' }}>Auditor 2 :</td>
      <td style={{ border: '1px solid black' }}></td>
      <td style={{ border: '1px solid black' }}></td>
      <td style={{ border: '1px solid black' }}></td>
    </tr>
  </tbody>
</table>




              </td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">8. Verified By <span className="text-xs italic">( Sign & name )</span></td>
              <td className="border p-4"> <br /></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">9. L2 Report Sent</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">10. Compliance Received</td>
              <td className="border p-2"></td>
            </tr>
            <td className="border p-2 font-bold align-top">11. Vulnerabilities / Risk Identified<br></br>    in Level 1 Report</td>
              <td className="border p-2">
                <div className="font-bold"></div>
                <div className="text-xs italic pl-2"></div>
                <table className="mt-2 w-full border border-black border-collapse">
                  <tbody>
                    <tr>
                      <td className="border p-1 w-1/4"> </td>
                      <td className="border p-1">High</td>
                      <td className="border p-1">Medium</td>
                      <td className="border p-1">Low</td>
                      <td className="border p-1">Total</td>
                    </tr>
                    <tr>
                      <td className="border p-1">Auditor 1:<br></br>Auditor 2 :</td>
                      <td className="border p-1"></td>
                      <td className="border p-1"></td>
                      <td className="border p-1"></td>
                      <td className="border p-1"></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            
            <tr>
              <td className="border p-2 font-bold">12.  Verified By <span className="text-xs italic">( Sign & name )</span></td>
              <td className="border p-4"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">13.  Final Report Sent</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">14.  Safe To Host Verified By <span className="text-xs italic">( Sign & name )</span></td>
              <td className="border p-4"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">15.  Safe To Host Sent</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">16. Report forwarded to CERT-In</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">17.  Invoice Sent</td>
              <td className="border p-2"></td>
            </tr>
            <tr>
              <td className="border p-2 font-bold">18.  Completed  & Closed</td>
              <td className="border p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Print Button (excluded from print) */}
      <button
        onClick={handlePrint}
        className="btn bg-blue-600 text-white px-4 py-2 mt-6 rounded print:hidden"
      >
        Print
      </button>
    </div>
  );
};

export default WithAuth(Workorder);
