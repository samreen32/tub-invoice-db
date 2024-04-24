import React, { createContext, useContext, useEffect, useState } from "react";
import { FETCH_BILL_TO, FETCH_DESCRIPPTION } from "../Auth_API";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [invoiceDetails, setInvoiceDetails] = useState({});
  const [addresses, setAddresses] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [adAvaiableDatePicker, setAdAvaiableDatePicker] = useState(false);
  const [adEstimateAvaiableDatePicker, setAdEstimateAvaiableDatePicker] = useState(false);

  const createDefaultItems = () => {
    const items = [];
    for (let i = 1; i <= 23; i++) {
      items.push({
        lot_no: "",
        description: "",
        quantity: 0,
        price_each: "0.00",
        total_amount: 0,
      });
    }
    return items;
  };

  // Set the initial state with 15 default items
  const [formData, setFormData] = useState({
    bill_to: [""],
    PO_number: "",
    PO_date: "",
    PO_Invoice_date: "",
    type_of_work: "",
    job_site_num: "",
    job_site_name: "",
    job_location: "",
    items: createDefaultItems(),
    invoice: {
      invoice_num: null,
      date: null,
      total_amount: null,
    },
  });

  const createDefaultUpdateItems = () => {
    const items = [];
    for (let i = 1; i <= 23; i++) {
      items.push({
        lot_no: "",
        description: "",
        quantity: 0,
        price_each: "0.00",
        total_amount: 0,
      });
    }
    return items;
  };

  const [formUpdateData, setFormUpdateData] = useState({
    bill_to: ["", "", ""],
    installer: "",
    PO_number: "",
    PO_date: "",
    PO_Invoice_date: "",
    type_of_work: "",
    job_site_num: "",
    job_site_name: "",
    job_location: "",
    items: createDefaultUpdateItems(),
    invoice: {
      invoice_num: null,
      date: null,
      total_amount: null,
    },
  });

  /* Estimate Invoice credentials */
  const generateRandomNumber = () => {
    return Math.floor(10000 + Math.random() * 90000);
  };

  const [estimateInvoiceDetails, setEstimateInvoiceDetails] = useState(null);
  const [estimateData, setEstimateData] = useState({
    estimate_no: generateRandomNumber(),
    estimate_address: [""],
    estimate_date: "",
    estimate_project: "",
    items: [
      {
        estimate_item: "",
        estimate_description: "",
        estimate_quantity: "",
        estimate_cost: "",
      },
    ],
    estimate_invoice: {
      estimate_total: null,
    },
  });

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

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await axios.get(FETCH_BILL_TO);
        setAddresses(response.data);
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
      }
    };

    fetchAddresses();
  }, []);


  useEffect(() => {
    const fetchDescriptions = async () => {
      try {
        const response = await axios.get(FETCH_DESCRIPPTION);
        setDescriptions(response.data);
      } catch (error) {
        console.error('Failed to fetch descriptions:', error);
      }
    };

    fetchDescriptions();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        invoiceDetails,
        setInvoiceDetails,
        addresses, setAddresses,
        descriptions, setDescriptions,
        adAvaiableDatePicker, setAdAvaiableDatePicker,
        adEstimateAvaiableDatePicker, setAdEstimateAvaiableDatePicker,
        formData,
        setFormData,
        formUpdateData, setFormUpdateData,
        estimateInvoiceDetails,
        setEstimateInvoiceDetails,
        estimateData,
        setEstimateData,
        months
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserLogin = () => useContext(AuthContext);

export default AuthProvider;
