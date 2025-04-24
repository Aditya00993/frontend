import React, { useState, useEffect, ChangeEvent, FormEvent, RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  StyleTextfield,
  StyleLabel,
  FormErrorMessage,
  ModalErrorMessage
} from '../lib/formstyles';
import { WithAuth } from "../lib/authutils";
import { currentUserCan } from '../lib/utilities';
import Button from '../components/button';
import { FormSkeleton } from '../components/skeletons';
import { getCompany } from '../lib/data/api';
import { upsertCompany } from '../lib/data/api';
import { Company } from '../lib/data/definitions';
import toast from 'react-hot-toast';

interface FormErrors {
  name?: string;
  address?: string;
  category?: string;
  sector?: string;
  hash_value?: string;
}

interface CompanyFormProps {
  id?: string;
  forwardedRef?: RefObject<HTMLDialogElement>;
  setRefresh?: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}

function CompanyForm({ id: companyId, forwardedRef, setRefresh, onClose }: CompanyFormProps): JSX.Element {
  const [id, setId] = useState(companyId);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  if (!currentUserCan('Manage Company')) {
    navigate('/access-denied');
  }

  const [formData, setFormData] = useState<Company>({
    name: '',
    address: '',
    category: '',
    sector: '',
    hash_value: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setLoading(true);
        try {
          const companyData = await getCompany(id) as Company;
          setFormData(companyData);
        } catch (error) {
          console.error("Error fetching company data:", error);
          setLoadingError(true);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setEditing(true);
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const closeModal = (override = false) => {
    if (!override && editing && !confirm('Quit without saving?')) return;
    setId('');
    if (forwardedRef?.current) forwardedRef.current.close();
    onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBtnDisabled(true);

    const newErrors: FormErrors = {};
    if (formData.name.length < 3) newErrors.name = 'Name should be at least three characters';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.sector) newErrors.sector = 'Sector is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setBtnDisabled(false);
      return;
    }

    try {
      await upsertCompany(formData as Company);
      toast.success('Company saved.');
      setEditing(false);
      if (setRefresh) setRefresh(true);
      closeModal(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSaveError(String(error));
    } finally {
      setBtnDisabled(false);
    }
  };

  if (loading) return <FormSkeleton numInputs={3} />;
  if (loadingError) return <ModalErrorMessage message="Error loading company" />;

  return (
    <div className="max-w-xl min-w-lg flex-1 rounded-lg">
      <h1 className="mb-3 text-2xl dark:text-white">{id ? "Edit" : "Create"} Auditee</h1>
      {saveError && <FormErrorMessage message={saveError} />}

      <form onSubmit={handleSubmit} id="companyForm">
        <div className="w-full mb-4">
          <label htmlFor="name" className={StyleLabel}>Auditee Name</label>
          <input name="name" id="name" value={formData.name} onChange={handleChange} className={StyleTextfield} required />
          {errors.name && <FormErrorMessage message={errors.name} />}
        </div>
         
        <div className="w-full mb-4">
          <label htmlFor="category" className={StyleLabel}>Category</label>
          <select name="category" id="category" value={formData.category} onChange={handleChange} className={StyleTextfield} required>
            <option value="">Select Category</option>
            <option value="central_ministry">Central Ministry/Department</option>
            <option value="govt_org">Organisation under Government Development</option>
            <option value="private_sector">Private Sector</option>
            <option value="public_sector">Public Sector</option>
            <option value="state_govt">State Government Department</option>
          </select>
          {errors.category && <FormErrorMessage message={errors.category} />}
        </div>
        <div className="w-full mb-4">
          <label htmlFor="sector" className={StyleLabel}>Sector</label>
          <select name="sector" id="sector" value={formData.sector} onChange={handleChange} className={StyleTextfield} required>
            <option value="">Select Sector</option>
            <option value="agriculture">Agriculture</option>
            <option value="defence">Defence</option>
            <option value="education">Education</option>
            <option value="energy">Energy</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="inf_broadcasting">Information and Broadcasting</option>
            <option value="inf_communication">Information and Communication Technology</option>
          </select>
          {errors.sector && <FormErrorMessage message={errors.sector} />}
        </div>
        
        <div className="w-full mb-4">
          <label htmlFor="address" className={StyleLabel}>Auditee Location</label>
          <input name="address" id="address" value={formData.address} onChange={handleChange} className={StyleTextfield} required />
          {errors.address && <FormErrorMessage message={errors.address} />}
        </div>

       

        <div className="w-full mb-4">
          <label htmlFor="hash_value" className={StyleLabel}>Hash Value</label>
          <input name="hash_value" id="hash_value" value={formData.hash_value || ''} onChange={handleChange} className={StyleTextfield} />
          {errors.hash_value && <FormErrorMessage message={errors.hash_value} />}
        </div>

        <div className="p-2 flex">
          <div className="w-1/2 flex justify-left">
            <Button className="bg-primary disabled:bg-slate-200" disabled={btnDisabled} type="submit">Save</Button>
            <Button className="bg-red-500 ml-1" onClick={() => closeModal()} disabled={btnDisabled}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default WithAuth(CompanyForm);
