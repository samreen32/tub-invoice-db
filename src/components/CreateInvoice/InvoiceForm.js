import React, { useEffect, useRef, useState } from "react";
import { UserLogin } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router";
import { INVOICE } from "../../Auth_API";
import axios from "axios";
import Swal from "sweetalert2";
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import 'react-datepicker/dist/react-datepicker.css';

function InvoiceForm() {
  let navigate = useNavigate();
  const { formData, setFormData, addresses, descriptions } = UserLogin();
  const [visibleBillToFields, setVisibleBillToFields] = useState(1);
  const createDefaultItems = (numItems = 23) => {
    return Array.from({ length: numItems }, () => ({
      lot_no: "",
      description: "",
      quantity: 0,
      price_each: "0.00",
      total_amount: 0,
    }));
  };

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      items: createDefaultItems()
    }));
  }, []);

  const inputRefs = useRef([]);

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    const formatPriceEach = (value) => {
      let numericValue = String(value);
      numericValue = numericValue.replace(/[^0-9.]/g, '');
      const dotIndex = numericValue.indexOf('.');
      if (dotIndex === -1 && numericValue.length > 2) {
        numericValue = numericValue.slice(0, 2) + '.' + numericValue.slice(2);
      }

      return numericValue;
    };

    const formattedValue = name === 'price_each' ? formatPriceEach(value) : value;
    setFormData((prevData) => {
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
    const newItems = Array.from({ length: 23 }, () => ({
      lot_no: "",
      description: "",
      quantity: 0,
      price_each: "0.00",
      total_amount: 0,
    }));
    setFormData(prevData => ({
      ...prevData,
      items: [...prevData.items, ...newItems]
    }));
  };

  const handleLotNoKeyPress = (e, index) => {
    if (e.key === 'Enter' && index === formData.items.length - 1) {
      handleAddItem();
      e.preventDefault();
    }
  };

  useEffect(() => {
    const lastIndex = formData.items.length - 1;
    if (inputRefs.current[lastIndex]) {
      inputRefs.current[lastIndex].focus();
    }
  }, [formData.items.length]);

  const fieldRefs = useRef([]);

  /* Press enter key to add new field as well as key focus */
  const handleBillToEnterKey = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newFieldIndex = index + 1;
      if (newFieldIndex >= formData.bill_to.length) {
        setFormData({
          ...formData,
          bill_to: [...formData.bill_to, '']
        });
        setVisibleBillToFields(newFieldIndex + 1);
      }
      setTimeout(() => {
        fieldRefs.current[newFieldIndex] && fieldRefs.current[newFieldIndex].focus();
      }, 0);
    }
  };

  useEffect(() => {
    fieldRefs.current = fieldRefs.current.slice(0, formData.bill_to.length);
  }, [formData.bill_to]);

  const updateBillToField = (index, value) => {
    setFormData((prevData) => {
      const updatedBillTo = [...prevData.bill_to];
      updatedBillTo[index] = value || '';
      return { ...prevData, bill_to: updatedBillTo };
    });
  };

  /* Endpoint integration */
  const handleCreateInvoice = async () => {
    try {
      const response = await axios.post(`${INVOICE}`, formData);
      console.log("Estimate generated successfully:", response.data);
      navigate(`/estimate_generated`);
      setFormData((prevData) => ({
        ...prevData,
        invoice: {
          ...prevData.invoice,
          invoice_num: response.data.invoice.invoice_num,
          date: response.data.invoice.date,
          total_amount: response.data.invoice.total_amount,
        },
      }));
      {
        Swal.fire({
          icon: "success",
          title: "Success...",
          text: "Estimate Generated!",
        });
        return;
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to create invoice. Please try again later.",
      });
      console.error("Failed to create invoice:", error.message);
    }
  };

  const handleGenerateNew = () => {
    setFormData({
      bill_to: [""],
      PO_number: "",
      PO_date: "",
      PO_Invoice_date: "",
      type_of_work: "",
      job_site_num: "",
      job_site_name: "",
      job_location: "",
      items: [
        {
          lot_no: "",
          description: "",
          quantity: 0,
          price_each: "0.00",
        },
      ],
      invoice: {
        invoice_num: null,
        date: null,
        total_amount: null,
      },
    });
    navigate("/main");
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

  const baseInvoiceSectionStyle = {
    marginTop: "126px",
    border: "2px solid white",
  };

  const handleEnterKeyPress = (event, currentField, currentIndex) => {
    if (event.key === "Enter") {
      event.preventDefault();

      let nextFieldId;
      let nextIndex = currentIndex;

      // Determining the next field based on the current field
      switch (currentField) {
        case "lot_no":
          nextFieldId = `description_${currentIndex}`; // Move to 'Description' of same item
          break;
        case "description":
          nextFieldId = `quantity_${currentIndex}`; // Move to 'Quantity' of same item
          break;
        case "quantity":
          nextFieldId = `price_each_${currentIndex}`; // Move to 'Price Each' of same item
          break;
        case "price_each":
          nextIndex = currentIndex + 1; // Move to next item's 'Lot No'
          if (nextIndex >= formData.items.length) {
            nextIndex = 0; // Optionally, wrap to the first item
          }
          nextFieldId = `lot_no_${nextIndex}`;
          break;
        default:
          // Default case to handle any unexpected fields
          return; // Do nothing if it's not one of the expected fields
      }

      const nextFieldElement = document.getElementById(nextFieldId);
      if (nextFieldElement) {
        nextFieldElement.focus();
      }
    }
  };

  return (
    <div id="invoice-generated">
      <div style={{ display: "flex", marginBottom: "50px" }}>
        <h2>
          <span
            onClick={handleGenerateNew}
            style={{ cursor: "pointer", marginLeft: "-40%" }}
          >
            <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
          </span>
          <span style={{ cursor: "pointer", marginLeft: "40%" }}>
            <b>Please enter your details</b>
          </span>
        </h2>
      </div>

      <div
        className="container px-5 py-5 mt-4"
        style={{ width: "100%" }}
      // ref={targetRef}
      >
        <div id="pdf">
          <div className="row">
            <div className="invoice-first-div col-8 px-5">
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
            <div className="col-4">
              <span
                onClick={handleCreateInvoice}
                style={{ float: "right", cursor: "pointer" }}
              >
                <button className="mt-4 px-3 py-2"
                  style={{ background: "green", color: "white", border: "none" }}
                >Generate</button>
                {/* <i class="fa fa-chevron-right fa-lg" aria-hidden="true"></i> */}
              </span>
            </div>
          </div>

          <form>
            <div className="row bill_to_div px-3" style={{ border: "2px solid white" }}>
              <div className="col-md-9">
                <p>
                  <p style={{ fontWeight: "800" }}>Bill To</p>
                  {[1, 2, 3].map((fieldIndex) => (
                    fieldIndex <= visibleBillToFields && (
                      <React.Fragment key={`bill_to_${fieldIndex}`}>
                        <Autocomplete
                          freeSolo
                          options={addresses}
                          value={formData.bill_to[fieldIndex - 1] || ''}
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
                              style={{ marginTop: "-20px", width: "50%", }}
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
              <div className="col-md-3">
                <p>
                  <b>Installer</b>  <br />
                  <TextField
                    id="installer"
                    type="text"
                    variant="standard"
                    name="installer"
                    value={formData.installer}
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
                <div className="col-md-1 ">
                  <b>PO No.</b>
                  {/* <br /> */}
                  <input
                    id="po_num"
                    type="text"
                    name="PO_number"
                    value={formData.PO_number}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
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
                  <TextField
                    id="PO_date"
                    name="PO_date"
                    type="date"
                    variant="standard"
                    placeholder="mm/dd/yyyy"
                    style={{ width: "75%", marginTop: "10px" }}
                    InputProps={{
                      disableUnderline: true
                    }}
                    value={formData.PO_date || ''}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />


                </div>
                <div className="col-md-2" style={{ textAlign: "center" }}>
                  <b>Type of Work</b>
                  <input
                    id="type_of_work"
                    type="text"
                    name="type_of_work"
                    value={formData.type_of_work}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
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
                  <input
                    id="job_site_no"
                    type="text"
                    name="job_site_num"
                    value={formData.job_site_num}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
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
                  <input
                    id="job_site_name"
                    type="text"
                    name="job_site_name"
                    value={formData.job_site_name}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
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
                  <input
                    id="job_location"
                    type="text"
                    name="job_location"
                    value={formData.job_location}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{
                      // marginTop: "12px",
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
                <span className="plus-icon">
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
                {formData.items.map((item, index) => (
                  <>
                    {(index + 1) % 24 === 0 && (
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

                            </div>
                          </div>

                          <div className="row bill_to_div" style={{ border: "2px solid white" }}>
                            <div className="col-md-9">
                              <p>
                                <p style={{ fontWeight: "800" }}>Bill To</p>
                                {[1, 2, 3].map((fieldIndex) => (
                                  fieldIndex <= visibleBillToFields && (
                                    <React.Fragment key={`bill_to_${fieldIndex}`}>
                                      <Autocomplete
                                        freeSolo
                                        options={addresses}
                                        value={formData.bill_to[fieldIndex - 1] || ''}
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
                                            style={{ marginTop: "-20px", width: `55%` }}
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
                              {/* <br /> */}
                              <input
                                id="po_num"
                                type="text"
                                name="PO_number"
                                value={formData.PO_number}
                                onChange={(e) => handleInputChange(undefined, e)}
                                style={{
                                  // marginTop: "12px",
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
                                type="date"
                                style={{ width: "75%", marginTop: "23px", }}
                                InputProps={{
                                  disableUnderline: true
                                }}
                                value={formData.PO_Invoice_date}
                              />

                            </div>
                            <div className="col-md-2" style={{ textAlign: "center" }}>
                              <b>Type of Work</b>
                              <br />
                              <input
                                id="type_of_work"
                                type="text"
                                name="type_of_work"
                                value={formData.type_of_work}
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
                                value={formData.job_site_num}
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
                                value={formData.job_site_name}
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
                                value={formData.job_location}
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
                          id={`lot_no_${index}`}
                          key={index}
                          ref={el => inputRefs.current[index] = el}
                          variant="standard"
                          type="text"
                          name="lot_no"
                          value={item.lot_no}
                          onChange={(e) => handleInputChange(index, e)}
                          onKeyPress={(e) => handleLotNoKeyPress(e, index)}
                          style={{
                            // marginTop: '8px',
                            width: `${Math.max(30, Math.min(10 + ((item.lot_no ? item?.lot_no?.length : 0) * 8), 100))}%`
                          }}
                          InputProps={{
                            disableUnderline: true
                          }}
                        // onKeyDown={(event) =>
                        //   handleEnterKeyPress(event, "lot_no", index)
                        // }
                        />
                      </div>
                      <div className="col-md-6">
                        <Autocomplete
                          id={`description_${index}`}
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
                                marginTop: index === 0 ? '-10px' : '-10px',
                                width: "100%"
                              }}
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
                          inputProps={{
                            style: { textAlign: 'center' }
                          }}
                          onKeyDown={(event) =>
                            handleEnterKeyPress(event, "quantity", index)
                          }
                          style={{ width: "100%", marginLeft: "30px" }}
                          InputProps={{
                            disableUnderline: true
                          }}
                        />
                      </div>
                      <div className="col-md-2 text-center" style={{ position: "relative" }}>
                        <TextField
                          id={`price_each_${index}`}
                          variant="standard"
                          type="text"
                          name="price_each"
                          // value={item.price_each > 0 ? formatPrice(item.price_each) : ""}
                          value={(item.price_each)}
                          onChange={(e) => handleInputChange(index, e)}
                          onKeyDown={(event) => handleEnterKeyPress(event, "price_each", index)}
                          style={{ width: "55%", }}
                          InputProps={{
                            startAdornment: item.price_each.length > 0 ? <InputAdornment position="start">
                              <span
                                style={{
                                  marginRight: 'auto', marginLeft: '10px',
                                  fontSize: '1.4rem', color: "black"
                                }}
                              >
                                $
                              </span>
                            </InputAdornment> : null,
                            disableUnderline: true,
                            style: { justifyContent: 'center' }
                          }}
                          inputProps={{
                            style: { textAlign: 'center' }
                          }}
                        />
                      </div>
                      <div className="col-md-1" style={{
                        marginLeft: "-50px", width: "150px", textAlign: "center"
                      }}>
                        <p style={{ marginTop: "0px" }}>
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
                  marginTop: formData.items.length === 2
                    ? "1000px"
                    : formData.items.length >= 3 && formData.items.length <= 5
                      ? "600px"
                      : formData.items.length >= 6 && formData.items.length <= 8
                        ? "500px"
                        : formData.items.length >= 9 && formData.items.length <= 11
                          ? "220px"
                          : formData.items.length >= 12 && formData.items.length <= 14
                            ? "6px"
                            : formData.items.length >= 15 && formData.items.length <= 16
                              ? "2px"
                              : formData.items.length >= 17 && formData.items.length <= 18
                                ? "2px"
                                : formData.items.length >= 19 && formData.items.length <= 20
                                  ? "2px"
                                  : formData.items.length >= 21 && formData.items.length <= 22
                                    ? "2px"
                                    : formData.items.length > 23
                                      ? "0px"
                                      : "0px"
                }}
              >
                <p style={{
                  marginRight: "70px",
                  // marginTop: formData.items.length > 17 ? "30%" : "0px"
                  marginTop: "30px"
                }}>
                  Total Due: {`$${formData?.total_amount?.toFixed(2) || ""}`}
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

export default InvoiceForm;
