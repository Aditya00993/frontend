import {  Company, 
          Project, 
          User,
          LoginUser, 
          IPAddressInfo,
          Vulnerability,
          VulnerabilityInstance,
          FilteredSet,
          Group } from './definitions'
import axios, { AxiosResponse, AxiosError } from 'axios'
interface AuthHeaders {
  headers: Record<string, string>;
}
function redirectIfUnauthorized(response: AxiosResponse): boolean | void {
  if(response?.status === 401){
    logout()
    return true
  } 
  return false
}

axios.defaults.withCredentials = true;


let response: AxiosResponse | AxiosError | undefined;
async function getOrRedirect(url: string, params?: any): Promise<any> {
  try {
    response = await axios.get(url, params);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if(!redirectIfUnauthorized(error.response)){
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  return response as AxiosResponse;
}
async function postOrRedirect(url: string, params?: any, headers?: any): Promise<AxiosResponse> {
  let response: AxiosResponse | AxiosError;
  try {
    response = await axios.post(url, params, headers);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if(!redirectIfUnauthorized(error.response)){
          throw error;
        }
        response = error;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  return response as AxiosResponse;
}
async function deleteOrRedirect(url: string, params?: any): Promise<AxiosResponse> {
  let response: AxiosResponse | AxiosError;
  try {
    response = await axios.delete(url, params );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        redirectIfUnauthorized(error.response);
        response = error;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
  return response as AxiosResponse;
}
export function apiUrl(endpoint:string = ''): string {
  return import.meta.env.VITE_APP_API_URL + endpoint;
  
}
export function uploadUrl(): string {
  return apiUrl('api/project/ckeditor/imageupload/')
}
export function simpleUploadConfig() {
  return {
    uploadUrl: uploadUrl(),
    withCredentials: true,
    ...authHeaders()
  }
}
export async function uploadFile(file: File) {
  const url = uploadUrl(); // should resolve to full backend URL
  const formData = new FormData();
  formData.append('upload', file);

  const config = {
    headers: {
      Authorization: `Bearer ${getAuthUser()?.access}`,  // ✅ token include hona chahiye
    }
  };

  try {
    const response = await axios.post(url, formData, config);
    console.log("✅ Upload response:", response.data);
    return response.data;
  } catch (err: any) {
    console.error("❌ Upload failed:", err.response?.data || err.message);
    throw new Error(err.response?.data?.error || err.message);
  }
}



export function authHeaders(): { headers: Record<string, string> } {
  const token = getAuthUser()?.access;
  const header = { headers: {'Authorization': `Bearer ${token}`} }
  return header;
}

export function setAuthUser(user: LoginUser): void {
  const jsonUser = JSON.stringify(user);
  localStorage.setItem('user', jsonUser);
  localStorage.setItem('lastRefresh', new Date().toISOString())
}

export function getAuthUser(): LoginUser | null {
  return _userObject()
}
//private function to get the user object from local storage
function _userObject(): LoginUser | null {
  const jsonUser = localStorage.getItem('user');
  if(jsonUser !== null) {
    return JSON.parse(jsonUser) as LoginUser;
  }
  return null;
}

export function shouldRefreshToken(): boolean {
  const lastRefresh = localStorage.getItem('lastRefresh')
  if(!lastRefresh) return true;
  const last = new Date(lastRefresh)
  const now = new Date()
  const diff = now.getTime() - last.getTime()
  return diff > 1000 * 60 * 28
}

export async function login(email: string, password:string) {
  const url = apiUrl('api/auth/login/');
  // login failure throws a 401 unauthorized exception
  // catch it here and return boolean; otherwise throw error
  console.log(email);
  console.log(password);
  let result
  try {
    const params = {  email, password }
    // const response = await axios.post(url, params, headers);
    const response = await postOrRedirect(url, params);
    result = response.data;
  } catch (error: any | unknown){
    if (axios.isAxiosError(error)) {
      if(error.response?.status == 401) {
        return false;
      } 
    }
    throw error;
  }
  if(!result?.access){
    return false;
  } else {
    const user = result as LoginUser;
    user.email = email;
    //now get the user's location
    const location = await getUserLocation()
    if(location){
      user.location = location as IPAddressInfo
    }
    setAuthUser(user)
    //now get the profile info
    const profile = await getMyProfile()
    const mergedUser: User = {
      ...user,
      ...profile
    }
    setAuthUser(mergedUser)
    return result;
  }
}
export async function refreshAuth() {
    const user = _userObject();
    if(!user){
      return null
    }
    try {
    const body = {refresh: user.refresh}
    const url = apiUrl('api/auth/token/refresh/');
    const response = await postOrRedirect(url, body, authHeaders());
    user.refresh = response.data.refresh
    user.access = response.data.access
    setAuthUser(user)
    return user;
  } catch (error) {
    logout()
    return null
  }
}
export async function logout() {
  const user = _userObject();
    if(!user){
      return null
    }
    const body = {refresh_token: user.refresh}
    const url = apiUrl('api/auth/logout/');
    await postOrRedirect(url, body, authHeaders());

    localStorage.removeItem('user');
    localStorage.removeItem('lastRefresh');
    } 

export async function fetchCustomers() {
  const url = apiUrl('api/customer/all-customer');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function fetchFilteredCustomers(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl(`api/customer/all-customer/filter`);
  const response = await getOrRedirect(url,  { params: params, ...authHeaders() });
  return response.data;
}

export async function getUserLocation(){ 
  try {
    const response = await getOrRedirect("https://ipapi.co/json/")
    return response.data
  } catch (error) {
    console.error('error getting user location', error)
    return null
  }  
}
export async function getCustomer(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`api/customer/customer/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function upsertCustomer(formData: Company): Promise<any> {
  let url = apiUrl(`api/customer/customer/add`);
  
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`api/customer/customer/edit/${formData['id']}/`);
  }
  const response = await postOrRedirect(url, formData, authHeaders())
  return response.data;    
}
export async function deleteCustomers(ids: any[]): Promise<any> {
  const url = apiUrl('api/customer/customer/delete');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}
export async function fetchProjects() {
  const url = apiUrl('api/project/get-projects/');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function fetchMyProjects() {
  const url = apiUrl('api/project/my-projects/');
  
  const response = await getOrRedirect(url, authHeaders());
  console.log(response.data)
  return response.data as FilteredSet;
}
export async function fetchFilteredProjects(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl('api/project/projects/filter/');
  const response = await getOrRedirect(url, { params: params, ...authHeaders() });
  return response.data as FilteredSet;
}


export async function searchProjects(name:string) { 
  const url = apiUrl(`api/project/projects/filter?name=${name}`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
interface ProjectReportParams {
  projectId: number
  Format: string
  Type: string
  Standard: string[]
}
interface APIParams {
  Standard: string;
  Format: string
  Type: string
}
export async function getProjectReport(props: ProjectReportParams) {
  //convet standard from array to string
  const { projectId, Standard, ...params } = props;
  const toSubmit: APIParams = {
    ...params,
    Standard: Standard.join(','),
  };
  const url = apiUrl(`api/project/report/${projectId}/`);
  const config = {
    responseType: 'blob' as const,
    ...authHeaders(),
    params: toSubmit,
  };
  const response = await getOrRedirect(url, config)
  return response
}
export async function fetchReportStandards() {
  const url = apiUrl('api/config/standards/')
  const response = await getOrRedirect(url, authHeaders());
  return response.data
}
export async function insertProjectType(name: string) {
  const url = apiUrl('api/config/project-type/create/')
  const response = await postOrRedirect(url, {name}, authHeaders())
  return response.data
}
export async function insertReportStandard(name: string) {
  const url = apiUrl('api/config/standards/create/')
  const response = await postOrRedirect(url, {name}, authHeaders())
  return response.data
}
export async function getProject(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`api/project/get-project/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function getProjectScopes(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`api/project/scope/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function markProjectAsCompleted(id: number): Promise<any> {
  const url = apiUrl(`api/project/status/completed/${id}/`);
  const response = await getOrRedirect(url, authHeaders())
  return response;
}
export async function markProjectAsOpen(id: number): Promise<any> {
  const url = apiUrl(`api/project/status/reopen/${id}/`);
  const response = await getOrRedirect(url, authHeaders())
  return response;
}
export async function insertProjectScopes(projectId: number , scope: any): Promise<any> {
  const url = apiUrl(`api/project/scope/add/${projectId}/`);
  const response = await postOrRedirect(url, scope, authHeaders())
  return response.data;
}
export async function updateProjectScope(id: number , scope: any): Promise<any> {
  const url = apiUrl(`api/project/scope/edit/${id}/`);
  const response = await postOrRedirect(url, scope, authHeaders())
  return response.data;
}
export async function fetchProjectRetests(id: number | undefined) {
  if(!id) return null;
  const url = apiUrl(`api/project/Retest/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  // this endpoint returns a 404 if no retests are found, so we need to return an empty array
  return response?.data || [];
}
export async function insertProjectRetest(data: any): Promise<any> {
  const url = apiUrl(`api/project/Retest/add`);
  const response = await postOrRedirect(url, data, authHeaders())
  return response.data;
}
export async function deleteProjectRetest(id: number | number[]): Promise<any> {
  const url = apiUrl(`api/project/Retest/delete/${id}/`);
  const response = await deleteOrRedirect(url, {data: id, ...authHeaders()})
  return response.data;
}
export async function markProjectRetestComplete(id: number): Promise<any> {
  const url = apiUrl(`api/project/retest/status/completed/${id}/`);
  const response = await getOrRedirect(url, authHeaders())
  return response.data;
}
export async function deleteProjectScope(id: number | number[] ): Promise<any> {
  const url = apiUrl('api/project/scope/delete/');
  let toDelete = Array.isArray(id) ? id : [id]
  const response = await deleteOrRedirect(url, {data: toDelete, ...authHeaders()})
  return response.data;
}

export async function deleteProjects(ids: any[]): Promise<any> {
  const url = apiUrl('api/project/delete-project/');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}
export async function fetchProjectTypes() {
  const url = apiUrl('api/config/project-type/')
  const response = await getOrRedirect(url, authHeaders());
  return response.data
}
export async function fetchProjectFindings(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`api/project/findings/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function getProjectVulnerability(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`api/project/vulnerability/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function RenderProjectVulnerability(id: string | undefined) {
  if(!id) return null;
  const url = apiUrl(`api/project/vulnerability/view/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}

export async function fetchVulnerabilityInstances(id: string | number | undefined): Promise<VulnerabilityInstance[]>  {
  const url = apiUrl(`api/project/vulnerability/instances/${id}/`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
// /api/project/vulnerability/instances/filter/<Vulneability-id>/?URL=&Parameter=&status=&limit=20&offset=0&order_by=asc&sort=id API 
export async function fetchFilteredVulnerabilityInstances(id: string | number | undefined, params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl(`api/project/vulnerability/instances/filter/${id}/`);
  const response = await getOrRedirect(url, { params: params, ...authHeaders() });
  return response.data;
}
export async function updateVulnerabilityStatus(id: number, status: string) {
  const url = apiUrl(`api/project/vulnerability/status/vulnerability/${id}/?status=${status}`);
  const response = await getOrRedirect(url, authHeaders())
  return response.data;
}
export async function bulkUpdateVulnerabilityStatus(ids: number[], status: string) {
  const url = apiUrl(`api/project/vulnerability/status/instances/?status=${status}`);
  const response = await postOrRedirect(url, ids, authHeaders())
  return response.data;
}

export async function deleteVulnerabilityInstances(ids: any[]): Promise<any> {
  const url = apiUrl('api/project/vulnerability/delete/instances/');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}

export async function deleteProjectVulnerabilities(ids: number[]): Promise<any> {
  const url = apiUrl('api/project/vulnerability/delete/vulnerability/');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}
export async function upsertProject(formData: Project | Partial<Project>): Promise<any> {
  let url = apiUrl(`api/project/add-project/`);
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`api/project/edit-project/${formData['id']}/`);
  }

  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
}
export async function updateProjectOwner(formData: Partial<Project>): Promise<any> {
  const url = apiUrl('api/project/edit-owner/')
  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
}

export async function insertProjectVulnerability(formData: any): Promise<any> {
  const url = apiUrl(`api/project/vulnerability/add/vulnerability/`)
  const data = formData
  if(formData.instances){
    data.instance = formData.instances
    delete data.instances
  }
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}
export async function updateProjectVulnerability(formData: any): Promise<any> {
  const url = apiUrl(`api/project/vulnerability/edit/${formData.id}/`)
  const data = formData
  if(formData.instances){
    data.instance = formData.instances
    delete data.instances
  }
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}
export async function uploadProjectVulnerabilities(projectId: number, file: File): Promise<any> {
  const url = apiUrl(`api/project/vulnerability/Nessus/csv/${projectId}/`)
  const config: AuthHeaders = authHeaders()
  config.headers['content-type'] = 'multipart/form-data'
  const data = {file: file} 
  const response = await postOrRedirect(url, data, config)
  return response.data
}
export async function updateProjectVulnerabilityInstance(data: any): Promise<any> {
  const url = apiUrl(`api/project/vulnerability/edit/instances/${data.id}/`)
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}
//pvid is the id of a ProjectVulnerability
export async function insertProjectVulnerabilityInstance(pvid: any, data: any[]): Promise<any> {
  const url = apiUrl(`api/project/vulnerability/add/instances/${pvid}/`)
  const response = await postOrRedirect(url, data, authHeaders());
  return response.data;
}
export async function updateProjectInstanceStatus(data: any): Promise<any> {
  const toSubmit = [
    data.id
  ]
  const url = apiUrl(`api/project/vulnerability/status/instances/?status=${data.status}`)
  const response = await postOrRedirect(url, toSubmit, authHeaders());
  return response.data;
}


export async function fetchCompanies() {
  const url = apiUrl('api/customer/all-company');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function fetchFilteredCompanies(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl(`api/customer/all-company/filter`);
  const response = await getOrRedirect(url,  { params: params, ...authHeaders() });
  return response.data;
}

export async function getCompany(id: string | undefined) {
  if (!id) return null;
  const url = apiUrl(`api/customer/company/${id}/`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function upsertCompany(formData: Company): Promise<any> {
  let url = apiUrl(`api/customer/company/add`);
 
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`api/customer/company/edit/${formData['id']}/`);
  }
  const headers = authHeaders()
  headers.headers['content-type'] = 'multipart/form-data'
  const response = await postOrRedirect(url, formData, headers);
  console.log(response.data);
  return response.data;
}

export async function deleteCompanies(ids: any[]): Promise<any> {
  const url = apiUrl('api/customer/company/delete');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}

export async function fetchVulnerabilities() {
  const url = apiUrl('api/vulndb/all-vulndb');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function fetchFilteredVulnerabilities(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl(`api/vulndb/all-vulndb/filter`);
  const response = await getOrRedirect(url,  { params: params, ...authHeaders() });
  return response.data;
}
export async function searchVulnerabilities(term:string) {
  const url = apiUrl(`api/vulndb/filter/?search=${term}`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function getVulnerability(id: string | undefined) {
  if (!id) return null;
  const url = apiUrl(`api/vulndb/${id}/`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function getVulnerabilityByName(name: string | undefined) {
  if (!name) return null;
  const url = apiUrl(`api/vulndb/database/?title=${name}`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function upsertVulnerability(formData: Vulnerability): Promise<any> {
  let url = apiUrl(`api/vulndb/add-vulndb`);
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`api/vulndb/edit-vulndb/${formData['id']}/`);
  }
  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
}
export async function deleteVulnerabilities(ids: any[]): Promise<any> {
  const url = apiUrl('api/vulndb/delete-vulndb');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}
export async function fetchGroups() {
  const url = apiUrl('api/auth/groups/list/');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function deleteGroups(ids: any[]): Promise<any> {
  const url = apiUrl('api/auth/groups/delete');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}

export async function getGroup(id: string | undefined) {
  if (!id) return null;
  const url = apiUrl(`api/auth/groups/${id}`);
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}
export async function upsertGroup(formData: Group): Promise<any> {
  let url = apiUrl(`api/auth/groups/create/`);
  if (Object.keys(formData).includes('id')) {
    url = apiUrl(`api/auth/groups/update/${formData['id']}/`);
  }
  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
}
export async function fetchUsers() {
  const url = apiUrl('api/auth/users');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function fetchFilteredUsers(params: Record<string, any>): Promise<FilteredSet> {
  const url = apiUrl('api/auth/users/filter/');
  if(params?.sort && params?.sort === ''){
    delete params.order_by
    delete params.sort
  }
  const response = await getOrRedirect(url, { params: params, ...authHeaders() });
  return response.data;
}
export async function deleteUsers(ids: any[]): Promise<any> {
  const url = apiUrl('api/auth/deleteuser');
  const config = {
    headers: authHeaders().headers,
    data: ids,
  };
  const response = await deleteOrRedirect(url, config);
  return response.data;
}

export async function getUser(id: string | undefined) {
  if (!id) return null;
  const url = apiUrl(`api/auth/user/${id}`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function getMyProfile() {
  const url = apiUrl(`api/auth/myprofile`);
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function upsertUser(formData: User): Promise<any> {
  let temp = formData;
  delete temp.profilepic;
  // delete temp.id;
  if(formData.id && !formData.password){
    delete temp.password
  }
  let url = apiUrl(`api/auth/adduser`);
  if (formData.id) {
    url = apiUrl(`api/auth/edituser/${formData['id']}`);
  }
  const response = await postOrRedirect(url, temp, authHeaders());
  return response.data;
}
export async function updateProfile(formData: User, profilepic:File|null = null): Promise<any> {
  const temp = formData as any;
  delete temp.id;
  delete temp.profilepic
  const config: AuthHeaders = authHeaders()
if(profilepic) {
    config.headers['content-type'] = 'multipart/form-data'
    temp.profilepic = profilepic
  }
  const url = apiUrl(`api/auth/editprofile`);
  const response = await postOrRedirect(url, temp, config);
  if(response.status == 200){
    //update the underyling auth user
    const current = getAuthUser()
    const profile = response.data
    const refreshed = {
      ...current,
      ...profile
    }
    setAuthUser(refreshed)
  }
  return response.data;
}
export async function changePassword(formData: User): Promise<any> {
  const url = apiUrl(`api/auth/changepassword`);
  const response = await postOrRedirect(url, formData, authHeaders());
  return response.data;
  
}
export async function fetchPermissionGroups() {
  const url = apiUrl('api/auth/groups/list/');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}
export async function fetchPermissions() {
  const url = apiUrl('api/auth/list/permission/');
  const response = await getOrRedirect(url, authHeaders());;
  return response.data;
}

export async function fetchCWE() {
  const url = apiUrl('api/vulndb/cwe/');
  const response = await getOrRedirect(url, authHeaders());
  return response.data;
}