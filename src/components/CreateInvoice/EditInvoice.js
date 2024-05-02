import React, { useEffect, useRef, useState } from "react";
import { UserLogin } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import TextField from "@mui/material/TextField";
import { useLocation, useNavigate } from "react-router";
import axios from "axios";
import Swal from "sweetalert2";
import { EDIT_INVOICE, FETCH_BILL_TO, FETCH_DESCRIPPTION, GET_INVOICE } from "../../Auth_API";
import generatePDF from "react-to-pdf";
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function EditInvoice() {
  let navigate = useNavigate();
  const targetRef = useRef();
  const { state } = useLocation();
  const { invoiceNum } = state;
  const { formUpdateData, setFormUpdateData, addresses, descriptions, setAddresses,
    setDescriptions } = UserLogin();
  const [visibleBillToFields, setVisibleBillToFields] = useState(3);

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
  }, [setAddresses, addresses]);

  useEffect(() => {
    const fetchDescriptions = async () => {
      try {
        const response = await axios.get(FETCH_DESCRIPPTION);
        // console.log(response.data, "sgdhjgs")
        setDescriptions(response.data);
      } catch (error) {
        console.error('Failed to fetch descriptions:', error);
      }
    };

    fetchDescriptions();
  }, [setDescriptions, descriptions]);

  const createDefaultUpdateItems = (numItems = 31) => {
    return Array.from({ length: numItems }, () => ({
      lot_no: "",
      description: "",
      quantity: "",
      price_each: "",
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
  const [typingTimeout, setTypingTimeout] = useState(null);

  const formatDateInput = (value) => {
    let numbers = value.replace(/[^\d]/g, '');  // Remove non-digit characters
    if (numbers.length > 8) {
      numbers = numbers.slice(0, 8);  // Limit to MMDDYYYY
    }
    if (numbers.length > 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;  // Format as MM/DD/YYYY
    } else if (numbers.length > 2) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;  // Format as MM/DD
    }
    return numbers;
  };

  const handleDateChange = (e) => {
    const { value } = e.target;
    const formattedDate = formatDateInput(value);
    setFormUpdateData(prevData => ({
      ...prevData,
      PO_date: formattedDate
    }));
  };


  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    formatAndSetPrice(index, name, value);
  };

  const formatAndSetPrice = (index, name, value) => {
    const formatPriceEach = (value) => {
      let numericValue = String(value).replace(/[^0-9.]/g, ''); // Remove non-numeric characters except the dot

      if (numericValue.length === 3 && !numericValue.includes('.')) {
        numericValue += ".00"; // Add .00 if there are exactly 3 digits and no decimal point
      }

      const dotIndex = numericValue.indexOf('.');
      if (dotIndex === -1 && numericValue.length > 3) {
        numericValue = numericValue.slice(0, 3) + '.' + numericValue.slice(3);
      } else if (dotIndex > 3) {
        numericValue = numericValue.slice(0, 3) + '.' + numericValue.slice(3);
      }

      return numericValue;
    };

    const formattedValue = name === 'price_each' ? formatPriceEach(value) : value;
    setFormUpdateData((prevData) => {
      if (index !== undefined) {
        const updatedItems = prevData.items.map((item, idx) => {
          if (idx === index) {
            return { ...item, [name]: formattedValue };
          }
          return item;
        });

        const totalAmount = updatedItems.reduce((total, item) => {
          const priceEach = String(item.price_each).replace('.', '');
          return total + (parseFloat(item.quantity || 0) * parseFloat(priceEach || 0));
        }, 0);

        return {
          ...prevData,
          items: updatedItems,
          total_amount: totalAmount,
        };
      } else {
        return {
          ...prevData,
          [name]: formattedValue,
        };
      }
    });
  };


  const handleAddItem = () => {
    const newItems = Array.from({ length: 30 }, () => ({
      lot_no: "",
      description: "",
      quantity: "",
      price_each: "",
      total_amount: 0,
    }));
    setFormUpdateData(prevData => ({
      ...prevData,
      items: [...prevData.items, ...newItems]
    }));
  };

  const handleLotNoKeyPress = (e, index) => {
    if (e.key === 'Enter' && index === formUpdateData.items.length - 1) {
      handleAddItem();
      e.preventDefault();
    }
  };

  useEffect(() => {
    const lastIndex = formUpdateData.items.length - 1;
    if (inputRefs.current[lastIndex]) {
      inputRefs.current[lastIndex].focus();
    }
  }, [formUpdateData.items.length]);

  const fieldRefs = useRef([]);

  /* Press enter key to add new field as well as key focus */
  const handleBillToEnterKey = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newFieldIndex = index + 1;
      if (newFieldIndex >= formUpdateData.bill_to.length) {
        setFormUpdateData({
          ...formUpdateData,
          bill_to: [...formUpdateData.bill_to, '']
        });
        setVisibleBillToFields(newFieldIndex + 1);
      }
      setTimeout(() => {
        fieldRefs.current[newFieldIndex] && fieldRefs.current[newFieldIndex].focus();
      }, 0);
    }
  };

  useEffect(() => {
    fieldRefs.current = fieldRefs.current.slice(0, formUpdateData.bill_to.length);
  }, [formUpdateData.bill_to]);

  const updateBillToField = (index, value) => {
    setFormUpdateData((prevData) => {
      const updatedBillTo = [...prevData.bill_to];
      updatedBillTo[index] = value || '';
      return { ...prevData, bill_to: updatedBillTo };
    });
  };

  /* Endpoint integration */
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      try {
        const response = await axios.get(`${GET_INVOICE}/${invoiceNum}`);
        if (response.data.success) {
          const invoiceData = response.data.invoice;
          console.log(invoiceData, "invoice data")
          // const validDate = invoiceData.PO_date ? new Date(invoiceData.PO_date) : null;
          setFormUpdateData({
            ...formUpdateData,
            ...invoiceData,
            // PO_date: validDate
          });
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error(error.message);
      }
    };
    fetchInvoiceDetails();
  }, [invoiceNum]);

  /* Update Endpoint integration */
  const handleUpdateInvoice = async () => {
    try {
      const response = await axios.put(
        `${EDIT_INVOICE}/${invoiceNum}`,
        formUpdateData
      );
      if (response.data.success) {
        navigate("/estimate_report");
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Estimate updated successfully.",
        });
        setFormUpdateData({
          bill_to: [""],
          installer: "",
          PO_number: "",
          PO_date: "",
          type_of_work: "",
          job_site_num: "",
          job_site_name: "",
          job_location: "",
          items: [
            {
              lot_no: "",
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

  const handleGenerateNew = () => {
    setFormUpdateData({
      bill_to: [""],
      installer: "",
      PO_number: "",
      PO_date: "",
      type_of_work: "",
      job_site_num: "",
      job_site_name: "",
      job_location: "",
      items: [
        {
          lot_no: "",
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
    navigate("/estimate_report");
  };

  function formatDate(date) {
    if (!date) {
      return "";
    }

    const d = new Date(date);
    let month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('/');
  }

  const baseInvoiceSectionStyle = {
    marginTop: "170px",
    border: "2px solid white",
    // height: "1200px"
  };

  const handleEnterKeyPress = (event, currentField, currentIndex) => {
    if (event.key === "Enter") {
      event.preventDefault();

      let nextFieldId;
      let nextIndex = currentIndex;
      switch (currentField) {
        case "lot_no":
          nextFieldId = `description_${currentIndex}`;
          break;
        case "description":
          nextFieldId = `quantity_${currentIndex}`;
          break;
        case "quantity":
          nextFieldId = `price_each_${currentIndex}`;
          break;
        case "price_each":
          if (currentIndex === formUpdateData.items.length - 1) {
            handleAddItem();
            return;
          } else {
            nextIndex = currentIndex + 1;
            nextFieldId = `lot_no_${nextIndex}`;
          }
          break;
        default:
          return; // Do nothing if it's not one of the expected fields
      }

      const nextFieldElement = document.getElementById(nextFieldId);
      if (nextFieldElement) {
        nextFieldElement.focus();
      }
    }
  };

  function safeParseFloat(value) {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  const calculateTotalAmount = (items) => {
    return items.reduce((total, item) => {
      const quantity = safeParseFloat(item.quantity);
      const priceEach = safeParseFloat(item.price_each);
      return total + (quantity * priceEach);
    }, 0);
  }

  const totalAmount = calculateTotalAmount(formUpdateData.items);

  const handleInputBlur = (index, e) => {
    const { name, value } = e.target;
    if (name === 'price_each') {
      const formattedValue = formatPriceEach(value);
      setFormUpdateData((prevData) => {
        const updatedItems = prevData.items.map((item, idx) => {
          if (idx === index) {
            return { ...item, [name]: formattedValue };
          }
          return item;
        });
        return {
          ...prevData,
          items: updatedItems
        };
      });
    }
  };

  const formatPriceEach = (value) => {
    let numericValue = String(value).replace(/[^0-9.]/g, ''); // Remove non-numeric characters except the dot
  
    // Return an empty string if no input is provided
    if (numericValue === "") {
      return ""; // Return empty if the field is empty
    }
  
    const dotIndex = numericValue.indexOf('.');
    if (numericValue.length <= 3 && dotIndex === -1) {
      numericValue += ".00"; // Append .00 if there are 1-3 digits and no decimal point
    } else if (dotIndex !== -1 && dotIndex > 3) {
      numericValue = numericValue.slice(0, 3) + '.' + numericValue.slice(3);
    }
  
    return numericValue;
  };

  // console.log(formUpdateData.PO_date, "hjgh")
  return (
    <div id="invoice-generated">
      <div className="row">
        {/* Left side */}
        <div className="col-3 offset-3" style={{ marginTop: "30px", marginLeft: "100px", flexDirection: "row" }}>
          <div className="add-container">
            <span onClick={() => {
              navigate("/main")
            }}
              className="new-invoice-btn" style={{ marginRight: "20px", background: "grey" }}
            >
              <i class="fas fa-home fa-1x"></i>
            </span>
            <span onClick={handleGenerateNew} className="new-invoice-btn">
              Estimate Report
            </span>
          </div>
        </div>

        {/* Right side */}
        <div
          className="col-6 offset-3"
          style={{ marginTop: "50px", textAlign: "right", marginLeft: "120px" }}
        >
          <span
            onClick={handleUpdateInvoice}
            className="new-invoice-btn"
            style={{ marginRight: "20px", background: "grey" }}
          >
            Update Estimate
          </span>
          <span
            onClick={() => generatePDF(targetRef, { filename: "estimate.pdf" })}
            // onClick={handleUpdateInvoiceAndGeneratePDF}
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
        <div id="pdf" >
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
                  Fax: &nbsp;&nbsp;&nbsp;&nbsp;(702) 445-6241
                </span>
              </address>
            </div>
            <div className="col-3">
              <p className="invoice-details">
                <b>Estimate</b>
              </p>
              <p>
                Number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {formUpdateData.invoice_num}
              </p>

              <p>
                Date
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {formatDate(formUpdateData.date)}
              </p>
            </div>
          </div>

          <form>
            <div className="row bill_to_div px-3" style={{ border: "2px solid white", marginTop: "10px" }}>
              <div className="col-md-9">
                <p>
                  <p style={{ fontWeight: "800" }}>Bill To</p>
                  {[1, 2, 3].map(
                    (fieldIndex) =>
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
                                inputRef={el => fieldRefs.current[fieldIndex] = el}
                                onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex)}
                                style={{ marginTop: "-20px", width: "50%", height: "100%" }}
                              // InputProps={{
                              //   disableUnderline: true
                              // }}
                              />
                            )}
                          />
                        </React.Fragment>
                      )
                  )}
                </p>
              </div>
              <div className="col-md-3">
                <p>
                  <b>Installer</b> <br />
                  <TextField
                    id="installer"
                    type="text"
                    variant="standard"
                    name="installer"
                    value={formUpdateData.installer}
                    onChange={(e) => handleInputChange(undefined, e)}
                    InputProps={{
                      disableUnderline: true
                    }}
                  />
                </p>
              </div>
            </div>

            <div className="last-row" style={{ marginTop: "-20px" }}>
              <div className="row po_details_div px-3">
                <div className="col-md-1 text-center">
                  <b>PO No.</b>
                  <input
                    id="po_num"
                    type="text"
                    name="PO_number"
                    value={formUpdateData.PO_number}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
                      width: "100%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",

                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />
                </div>
                <div className="col-md-2 text-center">
                  <b>PO Date</b>
                  <TextField
                    id="PO_date"
                    variant="standard"
                    placeholder="mm/dd/yyyy"
                    type="text"
                    style={{ width: "75%", marginTop: "10px", marginLeft: "30px" }}
                    InputProps={{
                      disableUnderline: true
                    }}
                    value={formUpdateData.PO_date || ""}
                    onChange={handleDateChange}
                  />
                </div>

                <div className="col-md-2" style={{ textAlign: "center" }}>
                  <span style={{ fontWeight: "800", marginLeft: "15px" }}>Type of Work</span>
                  <input
                    id="type_of_work"
                    type="text"
                    name="type_of_work"
                    value={formUpdateData.type_of_work}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
                      width: "100%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",

                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />
                </div>
                <div className="col-md-2 text-center">
                  <span style={{ fontWeight: "800", marginLeft: "15px" }}>Job Site No.</span>
                  <input
                    id="job_site_no"
                    type="text"
                    name="job_site_num"
                    value={formUpdateData.job_site_num}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
                      width: "100%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",

                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />
                </div>
                <div className="col-md-2 text-center">
                  <span style={{ marginLeft: "60px", fontWeight: "bold" }}>Job Name</span>
                  <input
                    id="job_site_name"
                    type="text"
                    name="job_site_name"
                    value={formUpdateData.job_site_name}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
                      width: "130%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",

                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />
                </div>
                <div className="col-md-3 text-center">
                  <b>Job Location</b>
                  <input
                    id="job_location"
                    type="text"
                    name="job_location"
                    value={formUpdateData.job_location}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
                      width: "100%",
                      border: "none",
                      textAlign: "center",
                      outline: "none",

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
                <div className="col-md-3">
                  <b>Lot No.</b>
                </div>
                <div className="col-md-5 text-center">
                  <b>Description</b>
                </div>
                <div className="col-md-1" style={{ marginLeft: "-2px" }}><b>Quantity</b></div>
                <div className="col-md-2" style={{ marginLeft: "20px" }}><b>Price Each</b></div>
                <div className="col-md-1" style={{ marginLeft: "-75px" }}> <b>Amount</b></div>
              </div>
              <div className="row item_details_div px-3" style={{ marginTop: "-65px" }}>
                {formUpdateData.items.map((item, index) => (
                  <>
                    {(index + 1) % 32 === 0 && (
                      <>
                        <h5 className="text-center"
                          style={{
                            fontSize: "25px",
                            fontWeight: "600",
                            marginTop: "120px"
                          }}
                        >
                          Thank You! We truly appreciate your business!
                        </h5>
                        <div style={baseInvoiceSectionStyle}>
                          <div className="row" >
                            <div className="invoice-first-div col-9 px-5" >
                              <img src={logo} alt="logo tub" />
                              <address className="mt-3 px-3">
                                <b style={{ fontSize: "28px" }}>Tub Pro's, Inc. </b>
                                <br />
                                <span style={{ fontSize: "22px" }}>
                                  PO Box 30596 <br />
                                  Las Vegas, NV. 89173 <br />
                                  Office: (702) 445-6232 <br />
                                  Fax: &nbsp;&nbsp;&nbsp;&nbsp;(702) 445-6241
                                </span>
                              </address>
                            </div>
                            <div className="col-3">
                              <p className="invoice-details">
                                <b>Estimate</b>
                              </p>
                              <p>
                                Number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                {formUpdateData.invoice_num}
                              </p>

                              <p>
                                Date
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                {formatDate(formUpdateData.date)}
                              </p>
                            </div>
                          </div>
                          <div className="row bill_to_div " style={{ border: "2px solid white", 
                          marginTop: "10px" }}>
                            <div className="col-md-9">
                              <p>
                                <p style={{ fontWeight: "800" }}>Bill To</p>
                                {[1, 2, 3].map(
                                  (fieldIndex) =>
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
                                              inputRef={el => fieldRefs.current[fieldIndex] = el}
                                              onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex)}
                                              style={{ marginTop: "-20px", width: "55%" }}
                                              InputProps={{
                                                disableUnderline: true
                                              }}
                                            />
                                          )}
                                        />
                                      </React.Fragment>
                                    )
                                )}
                              </p>
                            </div>
                            <div className="col-md-3">
                              <p>
                                <b>Installer</b> <br />
                                <TextField
                                  id="installer"
                                  type="text"
                                  variant="standard"
                                  name="installer"
                                  value={formUpdateData.installer}
                                  onChange={(e) => handleInputChange(undefined, e)}
                                  InputProps={{
                                    disableUnderline: true
                                  }}
                                />
                              </p>
                            </div>
                          </div>
                          <div className="row po_details_div px-3">
                            <div className="col-md-1 text-center">
                              <b>PO No.</b>
                              <input
                                id="po_num"
                                type="text"
                                name="PO_number"
                                value={formUpdateData.PO_number}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  // marginTop: "12px",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",

                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />
                            </div>
                            <div className="col-md-2 text-center">
                              <b>PO Date</b>
                              <TextField
                                id="PO_date"
                                variant="standard"
                                placeholder="mm/dd/yyyy"
                                type="text"
                                style={{ width: "75%", marginTop: "10px", marginLeft: "30px" }}
                                onChange={handleDateChange}
                                InputProps={{
                                  disableUnderline: true
                                }}
                                value={formUpdateData.PO_date}
                              />

                            </div>
                            <div className="col-md-2" style={{ textAlign: "center" }}>
                              <span style={{ fontWeight: "800", marginLeft: "15px" }}>Type of Work</span>
                              <input
                                id="type_of_work"
                                type="text"
                                name="type_of_work"
                                value={formUpdateData.type_of_work}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  // marginTop: "12px",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",

                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />
                            </div>
                            <div className="col-md-2 text-center">
                              <span style={{ fontWeight: "800", marginLeft: "15px" }}>Job Site No.</span>
                              <input
                                id="job_site_no"
                                type="text"
                                name="job_site_num"
                                value={formUpdateData.job_site_num}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  // marginTop: "12px",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",

                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />
                            </div>
                            <div className="col-md-2 text-center">
                              <span style={{ marginLeft: "60px", fontWeight: "bold" }}>Job Name</span>
                              <input
                                id="job_site_name"
                                type="text"
                                name="job_site_name"
                                value={formUpdateData.job_site_name}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  // marginTop: "12px",
                                  width: "130%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",

                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />
                            </div>
                            <div className="col-md-3 text-center">
                              <b>Job Location</b>
                              <input
                                id="job_location"
                                type="text"
                                name="job_location"
                                value={formUpdateData.job_location}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  // marginTop: "12px",
                                  width: "100%",
                                  border: "none",
                                  textAlign: "center",
                                  outline: "none",

                                }}
                                onFocus={(e) => e.target.style.borderBottomColor = "white"}
                                onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                              />

                            </div>
                          </div>

                          <div className="line"></div>
                          <div className="row item_details_div ">
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
                      <div className="col-md-3">
                        <TextField
                          id={`lot_no_${index}`}
                          key={index}
                          ref={el => inputRefs.current[index] = el}
                          variant="standard"
                          type="text"
                          name="lot_no"
                          autoComplete="off"
                          value={item.lot_no}
                          onKeyDown={(event) => handleEnterKeyPress(event, "lot_no", index)}
                          onChange={(e) => handleInputChange(index, e)}
                          style={{
                            width: `${Math.max(30, Math.min(10 + ((item.lot_no ? item?.lot_no?.length : 0) * 8), 100))}%`
                          }}
                          InputProps={{
                            disableUnderline: true
                          }}
                        />
                      </div>
                      <div className="col-md-5">
                        <Autocomplete
                          id={`description_${index}`}
                          freeSolo
                          options={descriptions}
                          // getOptionLabel={(option) => option ? option.label : ""}
                          value={item.description || ''}
                          onChange={(event, newValue) => handleInputChange(index, {
                            target: { name: 'description', value: newValue },
                          })
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              style={{ marginTop: index === 0 ? '-10px' : '-10px' }}
                              onKeyDown={(event) =>
                                handleEnterKeyPress(event, "description", index)
                              }
                            />
                          )}
                        />
                      </div>
                      <div className="col-md-1 text-center">
                        <TextField
                          id={`quantity_${index}`}
                          variant="standard"
                          type="text"
                          name="quantity"
                          value={item.quantity}
                          onChange={(e) => handleInputChange(index, e)}
                          autoComplete="off"
                          InputProps={{
                            disableUnderline: true,
                            style: { textAlign: 'center' }
                          }}
                          style={{ width: "100%", marginLeft: "45px" }}
                          onKeyDown={(event) =>
                            handleEnterKeyPress(event, "quantity", index)
                          }
                        />
                      </div>
                      <div className="col-md-2">
                        <TextField
                          id={`price_each_${index}`}
                          variant="standard"
                          type="text"
                          name="price_each"
                          value={item.price_each}
                          onChange={(e) => handleInputChange(index, e)}
                          onBlur={(e) => handleInputBlur(index, e)}
                          style={{ width: "60%", marginLeft: "45px" }}
                          autoComplete="off"
                          InputProps={{
                            startAdornment: item.price_each && item.price_each !== '' ?
                              <InputAdornment position="start">
                                <span
                                  style={{
                                    fontSize: "20px",
                                    color: "black"
                                  }}
                                >
                                  $
                                </span>
                              </InputAdornment> : null,
                            disableUnderline: true
                          }}
                          onKeyPress={(e) => handleLotNoKeyPress(e, index)}
                          onKeyDown={(event) => handleEnterKeyPress(event, "price_each", index)}
                        />
                      </div>

                      <div
                        className="col-md-1"
                        style={{
                          marginLeft: "-50px", width: "150px", textAlign: "center"
                        }}
                      >
                        <p style={{ height: "20px", margin: "0" }}>
                          {
                            (item.quantity && item.price_each) ?
                              `$${((item.quantity || 0) * (parseFloat(item.price_each) || 0)).toFixed(2)}` :
                              ''
                          }

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
                              ? "0px"
                              : formUpdateData.items.length >= 17 && formUpdateData.items.length <= 18
                                ? "2px"
                                : formUpdateData.items.length >= 19 && formUpdateData.items.length <= 20
                                  ? "2px"
                                  : formUpdateData.items.length >= 21 && formUpdateData.items.length <= 30
                                  ? "2px"
                                  : formUpdateData.items.length > 31
                                    ? "0px"
                                    : "0px"
                }}
              >
                <p style={{ marginRight: "70px", marginTop: "6px" }}>
                  Total Due: ${totalAmount.toFixed(2)}
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
      </div>
    </div>
  );
}

export default EditInvoice;
