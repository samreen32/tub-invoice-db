import React, { useEffect, useRef, useState } from "react";
import { UserLogin } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import TextField from "@mui/material/TextField";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import Swal from "sweetalert2";
import { EDIT_INVOICE, GET_INVOICE } from "../../Auth_API";
import generatePDF from "react-to-pdf";
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import calenderImg from "../../assets/img/ad_calender.png"

function EditSecondInvoice() {
  let navigate = useNavigate();
  const targetRef = useRef();
  const { state } = useLocation();
  const { invoiceNum } = state;
  const { formUpdateData, setFormUpdateData, addresses, descriptions,
    adAvaiableDatePicker, setAdAvaiableDatePicker } = UserLogin();
  const [visibleBillToFields, setVisibleBillToFields] = useState(3);
  const [focusedField, setFocusedField] = useState(null);
  const createDefaultUpdateItems = (numItems = 15) => {
    return Array.from({ length: numItems }, () => ({
      lot_no: "",
      description: "",
      quantity: 0,
      price_each: 0,
      total_amount: 0,
    }));
  };

  useEffect(() => {
    setFormUpdateData((prevData) => ({
      ...prevData,
      items: createDefaultUpdateItems()
    }));
  }, []);

  const inputRefs = useRef([]);

  const handleInputChange = (index, event) => {
    const newItems = formUpdateData.items.map((item, idx) => {
      if (idx === index) {
        return { ...item, [event.target.name]: event.target.value };
      }
      return item;
    });
    setFormUpdateData({ ...formUpdateData, items: newItems });
  };

  const handleAddItem = () => {
    const newItems = Array.from({ length: 15 }, () => ({
      lot_no: "",
      description: "",
      quantity: 0,
      price_each: 0,
      total_amount: 0,
    }));
    setFormUpdateData(prevData => ({
      ...prevData,
      items: [...prevData.items, ...newItems]
    }));
  };

  const handleLotNoKeyPress = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index === formUpdateData.items.length - 1) {
        handleAddItem();
      }
    }
  };

  useEffect(() => {
    const lastIndex = formUpdateData.items.length - 15; 
    if (inputRefs.current[lastIndex]) {
      inputRefs.current[lastIndex].focus();
    }
  }, [formUpdateData.items.length]);



  /* Endpoint integration */
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const response = await axios.get(`${GET_INVOICE}/${invoiceNum}`);
        if (response.data.success) {
          const invoiceData = response.data.invoice;
          // console.log(invoiceData, "invoice daat on invoice")
          const validDate = invoiceData.PO_Invoice_date ? new Date(invoiceData.PO_Invoice_date) : null;
          setFormUpdateData({
            ...formUpdateData,
            ...invoiceData,
            PO_Invoice_date: validDate
          });
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchInvoiceDetails();
  }, [invoiceNum, setFormUpdateData]);

  /* Update Endpoint integration */
  const handleUpdateInvoice = async () => {
    try {
      const response = await axios.put(
        `${EDIT_INVOICE}/${invoiceNum}`,
        formUpdateData
      );
      if (response.data.success) {
        navigate("/invoice");
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Invoice updated successfully.",
        });
        setFormUpdateData({
          bill_to: [""],
          installer: "",
          PO_number: "",
          PO_date: "",
          PO_Invoice_date: "",
          type_of_work: "",
          job_site_num: "",
          job_site_name: "",
          job_location: "",
          lot_no: "",
          items: [
            {
              description: "",
              quantity: "",
              price_each: "",
            },
          ],
          invoice: {
            invoice_num: null,
            date: null,
            total_amount: null,
          },
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: response.data.message || "Failed to update invoice.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update invoice. Please try again later.",
      });
      console.error("Failed to update invoice:", error.message);
    }
  };

  // const handleAddItem = (e) => {
  //   if (e.key === 'Enter') {
  //     setFormUpdateData((prevData) => ({
  //       ...prevData,
  //       items: [
  //         ...prevData.items,
  //         {
  //           description: "",
  //           quantity: 0,
  //           price_each: 0,
  //           total_amount: 0,
  //         },
  //       ],
  //     }));
  //     e.preventDefault();
  //   }
  // };

  /* Press enter key to add new field as well as key focus */
  const handleBillToEnterKey = (e, fieldIndex) => {
    if (e.key === "Enter") {
      const nextVisibleFields = Math.min(visibleBillToFields + 1, 3);
      setVisibleBillToFields(nextVisibleFields);
      setFocusedField(nextVisibleFields - 1);
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (focusedField !== null) {
      const inputRef = document.getElementById(`bill_to_${focusedField + 1}`);
      if (inputRef) {
        inputRef.focus();
      }
    }
  }, [focusedField]);

  const handleGenerateNew = () => {
    setFormUpdateData({
      bill_to: [""],
      installer: "",
      PO_number: "",
      PO_date: "",
      PO_Invoice_date: "",
      type_of_work: "",
      job_site_num: "",
      job_site_name: "",
      job_location: "",
      lot_no: "",
      items: [
        {
          description: "",
          quantity: "",
          price_each: "",
        },
      ],
      invoice: {
        invoice_num: null,
        date: null,
        total_amount: null,
      },
    });
    navigate("/invoice");
  };

  const getCurrentDate = () => {
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const year = String(currentDate.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  };

  const updateBillToField = (index, value) => {
    setFormUpdateData((prevData) => {
      const updatedBillTo = [...prevData.bill_to];
      updatedBillTo[index] = value || '';
      return { ...prevData, bill_to: updatedBillTo };
    });
  };

  const formatPrice = (price) => {
    const priceString = typeof price === 'string' ? price : String(price);
    const [integerPart, decimalPart] = priceString.split('.');

    let formattedDecimalPart = '';
    if (decimalPart) {
      formattedDecimalPart = decimalPart.replace(/0+$/, '');
      if (formattedDecimalPart === '') {
        formattedDecimalPart = '00';
      } else {
        formattedDecimalPart = formattedDecimalPart.padEnd(2, '0');
      }
    } else {
      formattedDecimalPart = '00';
    }

    return `${integerPart}.${formattedDecimalPart}`;
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date)) return '';
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const baseInvoiceSectionStyle = {
    marginTop: "190px",
    border: "2px solid white",
    // height: "1200px"
  };

  // Helper function to generate initial items
  // const generateInitialItems = (count) => {
  //   return Array.from({ length: count }, () => ({
  //     lot_no: "",
  //     description: "",
  //     quantity: 0,
  //     price_each: 0
  //   }));
  // };

  // // Inside your useEffect where you fetch or initialize formUpdateData
  // useEffect(() => {
  //   const initialItems = generateInitialItems(15);
  //   setFormUpdateData((prevData) => ({
  //     ...prevData,
  //     items: [...initialItems, ...prevData.items]
  //   }));
  // }, []);

  return (
    <div id="invoice-generated">
      <div className="row">
        {/* Left side */}
        <div className="col-3" style={{ marginTop: "55px", marginLeft: "60px" }}>
          <div className="add-container">
            <span onClick={() => {
              navigate("/main")
            }}
              className="new-invoice-btn" style={{ marginRight: "20px", background: "grey" }}
            >
              <i class="fas fa-home fa-1x"></i>
            </span>
            <span onClick={handleGenerateNew} className="new-invoice-btn">
              Invoice Report
            </span>
          </div>
        </div>

        {/* Right side */}
        <div
          className="col-6 offset-3"
          style={{ marginTop: "80px", textAlign: "right", marginLeft: "150px" }}
        >
          <span
            onClick={handleUpdateInvoice}
            className="new-invoice-btn"
            style={{ marginRight: "20px", background: "grey" }}
          >
            Update Invoice
          </span>
          <span
            onClick={() => generatePDF(targetRef, { filename: "invoice.pdf" })}
            className="new-invoice-btn"
            style={{ background: "green", border: "none" }}
          >
            Generate PDF
          </span>
        </div>
      </div>

      <div
        className="container px-5 py-5 mt-4"
        style={{ width: "100%" }}
        ref={targetRef}
      >
        <div id="pdf">
          <div className="row">
            <div className="invoice-first-div col-9 px-5">
              <img src={logo} alt="logo tub" />
              <address className="mt-3 px-3">
                <b style={{ fontSize: "28px" }}>Tub Pro's, Inc. </b>
                <br />
                <span style={{ fontSize: "22px" }}>
                  PO Box 30596 <br />
                  Las Vegas, NV. 89173 <br />
                  Office: (702) 445-6232 <br />
                  Fax: (702) 445-6241
                </span>
              </address>
            </div>
            <div className="col-3">
              <p className="invoice-details">
                <b>Invoice</b>
              </p>
              <p>
                Number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {formUpdateData.invoice_num}
              </p>
              <p>
                Date
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {getCurrentDate()}
              </p>

            </div>
          </div>

          <form>
            <div className="row bill_to_div px-3" style={{ border: "2px solid white" }}>
              <div className="col-md-9">
                <p>
                  <b>Bill To</b> <br /><br />
                  {[1, 2, 3].map((fieldIndex) => (
                    fieldIndex <= visibleBillToFields && (
                      <React.Fragment key={`bill_to_${fieldIndex}`}>
                        <Autocomplete
                          freeSolo
                          options={addresses}
                          value={formUpdateData.bill_to[fieldIndex - 1] || ''}
                          onChange={(event, newValue) => {
                            updateBillToField(fieldIndex - 1, newValue);
                          }}
                          onInputChange={(event, newInputValue) => {
                            updateBillToField(fieldIndex - 1, newInputValue);
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex - 1)}
                              style={{ marginTop: "-20px", width: "50%", marginBottom: "15px" }}
                            // InputProps={{
                            //   disableUnderline: true
                            // }}
                            />
                          )}
                        />
                      </React.Fragment>
                    )
                  ))}
                </p>
              </div>
            </div>

            <div className="last-row" style={{ marginTop: "-20px" }}>
              <div className="row po_details_div px-3">
                <div className="col-md-1 ">
                  <b>PO No.</b>
                  <br />
                  <input
                    id="po_num"
                    type="text"
                    name="PO_number"
                    value={formUpdateData.PO_number}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",
                      borderBottom: "none",
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />
                </div>
                <div className="col-md-2 text-center">
                  <b>PO Date</b>
                  <br />
                  <TextField
                    readOnly
                    id="PO_Invoice_date"
                    variant="standard"
                    placeholder="mm/dd/yyyy"
                    type="text"
                    style={{ width: "75%", marginTop: "23px", }}
                    InputProps={{
                      endAdornment: (
                        <img
                          src={calenderImg}
                          alt='calendar'
                          onClick={() => setAdAvaiableDatePicker(true)}
                          style={{ cursor: 'pointer', }}
                        />
                      ),
                      disableUnderline: true
                    }}
                    value={formatDate(formUpdateData.PO_Invoice_date)}
                  />
                  {adAvaiableDatePicker && (
                    <div style={{ position: 'absolute', zIndex: 1000 }}>
                      <DatePicker
                        selected={formUpdateData.PO_Invoice_date}
                        onChange={(date) => {
                          setFormUpdateData({ ...formUpdateData, PO_Invoice_date: date });
                          setAdAvaiableDatePicker(false);
                        }}
                        dateFormat="MM/dd/yyyy"
                        inline
                      />
                    </div>
                  )}
                </div>
                <div className="col-md-2" style={{ textAlign: "center" }}>
                  <b>Type of Work</b>
                  <br />
                  <input
                    id="type_of_work"
                    type="text"
                    name="type_of_work"
                    value={formUpdateData.type_of_work}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",
                      borderBottom: "none",
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />
                </div>
                <div className="col-md-2 text-center">
                  <b>Job Site No.</b>
                  <br />
                  <input
                    id="job_site_no"
                    type="text"
                    name="job_site_num"
                    value={formUpdateData.job_site_num}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",
                      borderBottom: "none",
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />
                </div>
                <div className="col-md-2 text-center">
                  <span style={{ marginLeft: "50px", fontWeight: "bold" }}>Job Name</span>
                  <br />
                  <input
                    id="job_site_name"
                    type="text"
                    name="job_site_name"
                    value={formUpdateData.job_site_name}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      marginTop: "12px",
                      width: "130%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",
                      borderBottom: "none",

                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />
                </div>
                <div className="col-md-3 text-center">
                  <b>Job Location</b>
                  <br />
                  <input
                    id="job_location"
                    type="text"
                    name="job_location"
                    value={formUpdateData.job_location}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",
                      borderBottom: "none",
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />

                </div>
              </div>

              <div className="line"></div>
              <div className="row item_details_div px-3">
                <span className="plus-icon" onClick={handleAddItem}>
                  {/* <i className="fas fa-plus-circle"></i> */}
                </span>
                &nbsp;
                <div className="col-md-2">
                  <b>Lot No.</b>
                </div>
                <div className="col-md-6 text-center">
                  <b>Description</b>
                </div>
                <div className="col-md-1" style={{ marginLeft: "-2px" }}><b>Quantity</b></div>
                <div className="col-md-2" style={{ marginLeft: "20px" }}><b>Price Each</b></div>
                <div className="col-md-1" style={{ marginLeft: "-75px" }}> <b>Amount</b></div>
              </div>
              {/* <div style={{ height: '900px', }}> */}
              <div className="row item_details_div px-3" style={{ marginTop: "-65px" }}>
                {formUpdateData.items.map((item, index) => (
                  <>
                    {(index + 1) % 16 === 0 && (
                      <>
                        <h5 className="text-center"
                          style={{
                            fontSize: "25px",
                            fontWeight: "600",
                            // marginBottom: "-20px"
                          }}
                        >
                          Thank You! We truly appreciate your business!
                        </h5>
                        <div style={baseInvoiceSectionStyle}>
                          <div className="row">
                            <div className="invoice-first-div col-9 ">
                              <img src={logo} alt="logo tub" />
                              <address className="mt-3 px-3">
                                <b style={{ fontSize: "28px" }}>Tub Pro's, Inc. </b>
                                <br />
                                <span style={{ fontSize: "22px" }}>
                                  PO Box 30596 <br />
                                  Las Vegas, NV. 89173 <br />
                                  Office: (702) 445-6232 <br />
                                  Fax: (702) 445-6241
                                </span>
                              </address>
                            </div>
                            <div className="col-3">
                              <p className="invoice-details">
                                <b>Invoice</b>
                              </p>
                              <p>
                                Number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                {formUpdateData.invoice_num}
                              </p>
                              <p>
                                Date
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                {getCurrentDate()}
                              </p>

                            </div>
                          </div>

                          <div className="row bill_to_div" style={{ border: "2px solid white" }}>
                            <div className="col-md-9">
                              <p>
                                <b>Bill To</b> <br /><br />
                                {[1, 2, 3].map((fieldIndex) => (
                                  fieldIndex <= visibleBillToFields && (
                                    <React.Fragment key={`bill_to_${fieldIndex}`}>
                                      <Autocomplete
                                        freeSolo
                                        options={addresses}
                                        value={formUpdateData.bill_to[fieldIndex - 1] || ''}
                                        onChange={(event, newValue) => {
                                          updateBillToField(fieldIndex - 1, newValue);
                                        }}
                                        onInputChange={(event, newInputValue) => {
                                          updateBillToField(fieldIndex - 1, newInputValue);
                                        }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            variant="standard"
                                            onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex - 1)}
                                            style={{ marginTop: "-20px", width: `55%`, marginBottom: "15px" }}
                                          />
                                        )}
                                      />
                                    </React.Fragment>
                                  )
                                ))}
                              </p>
                            </div>
                          </div>

                          <div className="row po_details_div">
                            <div className="col-md-1 ">
                              <b>PO No.</b>
                              <br />
                              <input
                                id="po_num"
                                type="text"
                                name="PO_number"
                                value={formUpdateData.PO_number}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  marginTop: "12px",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",
                                  borderBottom: "none",
                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />
                            </div>
                            <div className="col-md-2 text-center">
                              <b>PO Date</b>
                              <br />
                              <TextField
                                readOnly
                                id="PO_Invoice_date"
                                variant="standard"
                                placeholder="mm/dd/yyyy"
                                type="text"
                                style={{ width: "75%", marginTop: "23px", }}
                                InputProps={{
                                  endAdornment: (
                                    <img
                                      src={calenderImg}
                                      alt='calendar'
                                      onClick={() => setAdAvaiableDatePicker(true)}
                                      style={{ cursor: 'pointer', }}
                                    />
                                  ),
                                  disableUnderline: true
                                }}
                                value={formatDate(formUpdateData.PO_Invoice_date)}
                              />
                              {adAvaiableDatePicker && (
                                <div style={{ position: 'absolute', zIndex: 1000 }}>
                                  <DatePicker
                                    selected={formUpdateData.PO_Invoice_date}
                                    onChange={(date) => {
                                      setFormUpdateData({ ...formUpdateData, PO_Invoice_date: date });
                                      setAdAvaiableDatePicker(false);
                                    }}
                                    dateFormat="MM/dd/yyyy"
                                    inline
                                  />
                                </div>
                              )}
                            </div>
                            <div className="col-md-2" style={{ textAlign: "center" }}>
                              <b>Type of Work</b>
                              <br />
                              <input
                                id="type_of_work"
                                type="text"
                                name="type_of_work"
                                value={formUpdateData.type_of_work}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  marginTop: "12px",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",
                                  borderBottom: "none",
                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />
                            </div>
                            <div className="col-md-2 text-center">
                              <b>Job Site No.</b>
                              <br />
                              <input
                                id="job_site_no"
                                type="text"
                                name="job_site_num"
                                value={formUpdateData.job_site_num}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  marginTop: "12px",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",
                                  borderBottom: "none",
                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />
                            </div>
                            <div className="col-md-2 text-center">
                              <span style={{ marginLeft: "50px", fontWeight: "bold" }}>Job Name</span>
                              <br />
                              <input
                                id="job_site_name"
                                type="text"
                                name="job_site_name"
                                value={formUpdateData.job_site_name}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  marginTop: "12px",
                                  width: "130%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",
                                  borderBottom: "none",
                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />
                            </div>
                            <div className="col-md-3 text-center">
                              <b>Job Location</b>
                              <br />
                              <input
                                id="job_location"
                                type="text"
                                name="job_location"
                                value={formUpdateData.job_location}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  marginTop: "12px",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",
                                  borderBottom: "none",
                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />

                            </div>
                          </div>

                          <div className="line"></div>
                          <div className="row item_details_div">
                            <span className="plus-icon" onClick={handleAddItem}>
                              {/* <i className="fas fa-plus-circle"></i> */}
                            </span>
                            &nbsp;
                            <div className="col-md-2">
                              <b>Lot No.</b>
                            </div>
                            <div className="col-md-6 text-center">
                              <b>Description</b>
                            </div>
                            <div className="col-md-1" style={{ marginLeft: "-2px" }}><b>Quantity</b></div>
                            <div className="col-md-2" style={{ marginLeft: "20px" }}><b>Price Each</b></div>
                            <div className="col-md-1" style={{ marginLeft: "-75px" }}> <b>Amount</b></div>
                          </div>
                        </div>
                      </>
                    )}

                    <div
                      className="row"
                      style={{ marginTop: index === 0 ? "6%" : "0px" }}
                    >
                      <div className="col-md-2">
                        <TextField
                          key={index}
                          ref={el => inputRefs.current[index] = el}
                          variant="standard"
                          type="text"
                          name="lot_no"
                          value={item.lot_no}
                          onChange={(e) => handleInputChange(index, e)}
                          onKeyPress={(e) => handleLotNoKeyPress(e, index)}
                          style={{
                            marginTop: '8px',
                            width: `${Math.max(30, Math.min(10 + ((item.lot_no ? item?.lot_no?.length : 0) * 8), 100))}%`
                          }}
                          InputProps={{
                            disableUnderline: true
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <Autocomplete
                          freeSolo
                          options={descriptions}
                          value={item.description || ''}
                          onChange={(event, newValue) => {
                            handleInputChange(index, {
                              target: {
                                name: 'description',
                                value: newValue,
                              },
                            });
                          }}
                          onInputChange={(event, newInputValue, reason) => {
                            if (reason === 'input') {
                              handleInputChange(index, {
                                target: {
                                  name: 'description',
                                  value: newInputValue,
                                },
                              });
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              style={{
                                marginTop: index === 0 ? '-5px' : '-5px',
                                width: "100%"
                              }}
                              onKeyPress={handleLotNoKeyPress}
                            />
                          )}
                        />
                      </div>

                      <div className="col-md-1 text-center">
                        <TextField
                          id="quantity"
                          variant="standard"
                          type="number"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleInputChange(index, e)}
                          inputProps={{
                            style: { textAlign: 'center' }
                          }}
                          style={{ width: "100%", marginTop: "8px", marginLeft: "30px" }}
                        />
                      </div>
                      <div className="col-md-2 text-center" style={{ position: "relative" }}>
                        <TextField
                          id="price_each"
                          variant="standard"
                          type="number"
                          name="price_each"
                          value={formatPrice(item.price_each)}
                          onChange={(e) => handleInputChange(index, e)}
                          style={{ width: "45%", marginTop: "8px" }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <span style={{ fontSize: '1.4rem', color: "black" }}>$</span>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </div>
                      <div className="col-md-1" style={{
                        marginLeft: "-50px", width: "150px", textAlign: "center"
                      }}>
                        <p style={{ marginTop: "20px" }}>
                          {`$${((item.quantity || 0) * (item.price_each || 0)).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  </>
                ))}
              </div>

              <div
                className="invoice-last-div px-3"
                style={{
                  marginTop: formUpdateData.items.length === 2
                    ? "1000px"
                    : formUpdateData.items.length >= 3 && formUpdateData.items.length <= 5
                      ? "600px"
                      : formUpdateData.items.length >= 6 && formUpdateData.items.length <= 8
                        ? "500px"
                        : formUpdateData.items.length >= 9 && formUpdateData.items.length <= 11
                          ? "220px"
                          : formUpdateData.items.length >= 12 && formUpdateData.items.length <= 14
                            ? "6px"
                            : formUpdateData.items.length >= 15 && formUpdateData.items.length <= 16
                              ? "2px"
                              : formUpdateData.items.length > 17
                                ? "0px"
                                : "50px"
                }}
              >
                <p style={{
                  marginRight: "70px",
                  // marginTop: formUpdateData.items.length > 17 ? "30%" : "0px"
                  marginTop: "30px"
                }}>
                  Total Due: {`$${formUpdateData?.total_amount?.toFixed(2) || ""}`}
                </p>
                <h5 style={{
                  fontSize: "25px",
                  fontWeight: "600",
                  marginTop: "-20px"
                }}>
                  Thank You! We truly appreciate your business!
                </h5>
              </div>
            </div>
          </form>
        </div>
      </div >
    </div >
  );
}

export default EditSecondInvoice;
