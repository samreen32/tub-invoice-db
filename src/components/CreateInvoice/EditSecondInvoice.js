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

  /* Input field validation */
  const handleInputChange = (index, e) => {
    const { name, value } = e?.target || {};

    setFormUpdateData((prevData) => {
      if (index !== undefined) {
        const updatedItems = [...prevData.items];
        updatedItems[index] = {
          ...updatedItems[index],
          [name]: value,
        };

        const totalAmount = updatedItems.reduce(
          (total, item) =>
            total + (item.quantity || 0) * (item.price_each || 0),
          0
        );

        return {
          ...prevData,
          items: updatedItems,
          total_amount: totalAmount,
        };
      } else {
        if (
          name === "bill_to_1" ||
          name === "bill_to_2" ||
          name === "bill_to_3"
        ) {
          const updatedBillTo = [...prevData.bill_to];
          const fieldIndex = Number(name.split("_")[2]);
          updatedBillTo[fieldIndex - 1] = value;

          return {
            ...prevData,
            bill_to: updatedBillTo,
          };
        } else {
          return {
            ...prevData,
            [name]: value,
          };
        }
      }
    });
  };

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

  const handleAddItem = () => {
    setFormUpdateData((prevData) => ({
      ...prevData,
      items: [
        ...prevData.items,
        {
          description: "",
          quantity: 0,
          price_each: 0,
          total_amount: 0,
        },
      ],
    }));
  };

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
                  Office: (702)445-6232 <br />
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
                              style={{ marginTop: "-20px", width: "50%", }}
                            />
                          )}
                        />
                        <br />
                      </React.Fragment>
                    )
                  ))}
                </p>
              </div>

              {/* <div className="col-md-3">
                <p>
                  <b>Installer</b> <br />
                  <TextField
                    id="installer"
                    type="text"
                    variant="standard"
                    name="installer"
                    value={formUpdateData.installer}
                    onChange={(e) => handleInputChange(undefined, e)}
                  />
                </p>
              </div> */}
            </div>

            <div className="last-row" style={{ marginTop: "-20px" }}>
              <div className="row po_details_div px-3">
                <div className="col-md-1 ">
                  <b>PO No.</b>
                  <br />
                  <TextField
                    id="po_num"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    // inputProps={{
                    //   style: { textAlign: 'center' }
                    // }}
                    name="PO_number"
                    value={formUpdateData.PO_number}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%" }}
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
                    style={{ width: "80%", marginTop: "12px", }}
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
                  <TextField
                    id="type_of_work"
                    type="text"
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                    }}
                    name="type_of_work"
                    value={formUpdateData.type_of_work}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%", marginLeft: '16%' }}
                  />
                </div>
                <div className="col-md-2 text-center">
                  <b>Job Site No.</b>
                  <br />
                  <TextField
                    id="job_site_no"
                    type="text"
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                    }}
                    name="job_site_num"
                    value={formUpdateData.job_site_num}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%", marginLeft: '30%' }}
                  />
                </div>
                <div className="col-md-2 text-center">
                  <b>Job Name</b>
                  <br />
                  <TextField
                    id="job_site_name"
                    type="text"
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                    }}
                    name="job_site_name"
                    value={formUpdateData.job_site_name}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%", marginLeft: '16%' }}
                  />
                </div>
                <div className="col-md-3 text-center">
                  <b>Job Location</b>
                  <br />
                  <TextField
                    id="job_location"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="job_location"
                    value={formUpdateData.job_location}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%", marginLeft: '16%' }}
                  />
                </div>
              </div>

              <div className="line"></div>
              {/* <div style={{ overflowY: 'auto', overflowX: "hidden", height: '1050px' }}> */}
              <div className="row item_details_div px-3">
                <span className="plus-icon" onClick={handleAddItem}>
                  <i className="fas fa-plus-circle"></i>
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
              <div className="row item_details_div px-3" style={{ marginTop: "-65px" }}>
                {formUpdateData.items.map((item, index) => (
                  <>
                    {(index + 1) % 16 === 0 && (
                      <div style={{ marginTop: "160px" }}>
                        {/* <hr /> */}
                        <div className="row">
                          <div className="invoice-first-div col-9 ">
                            <img src={logo} alt="logo tub" />
                            <address className="mt-3 px-3">
                              <b style={{ fontSize: "28px" }}>Tub Pro's, Inc. </b>
                              <br />
                              <span style={{ fontSize: "22px" }}>
                                PO Box 30596 <br />
                                Las Vegas, NV. 89173 <br />
                                Office: (702)445-6232 <br />
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
                                          style={{ marginTop: "-20px", width: `55%` }}

                                        />
                                      )}
                                    />
                                    <br />
                                  </React.Fragment>
                                )
                              ))}
                            </p>
                          </div>

                          {/* <div className="col-md-3">
                            <p>
                              <b>Installer</b> <br />
                              <TextField
                                id="installer"
                                type="text"
                                variant="standard"
                                name="installer"
                                value={formUpdateData.installer}
                                onChange={(e) => handleInputChange(undefined, e)}
                              />
                            </p>
                          </div> */}
                        </div>

                        <div className="row po_details_div">
                          <div className="col-md-1 ">
                            <b>PO No.</b>
                            <br />
                            <TextField
                              id="po_num"
                              type="text"
                              variant="standard"
                              InputProps={{ disableUnderline: true }}
                              // inputProps={{
                              //   style: { textAlign: 'center' }
                              // }}
                              name="PO_number"
                              value={formUpdateData.PO_number}
                              onChange={(e) => handleInputChange(undefined, e)}
                              style={{ marginTop: "12px", width: "100%" }}
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
                              style={{ width: "80%", marginTop: "12px", }}
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
                            <TextField
                              id="type_of_work"
                              type="text"
                              variant="standard"
                              InputProps={{
                                disableUnderline: true,
                              }}
                              // inputProps={{
                              //   style: { marginLeft: '50px', }
                              // }}
                              name="type_of_work"
                              value={formUpdateData.type_of_work}
                              onChange={(e) => handleInputChange(undefined, e)}
                              style={{ marginTop: "12px", width: "100%", marginLeft: '16%' }}
                            />
                          </div>
                          <div className="col-md-2 text-center">
                            <b>Job Site No.</b>
                            <br />
                            <TextField
                              id="job_site_no"
                              type="text"
                              variant="standard"
                              InputProps={{
                                disableUnderline: true,
                                // style: { marginLeft: '10px' },
                              }}
                              // inputProps={{
                              //   style: { textAlign: 'center' }
                              // }}
                              name="job_site_num"
                              value={formUpdateData.job_site_num}
                              onChange={(e) => handleInputChange(undefined, e)}
                              style={{ marginTop: "12px", width: "100%", marginLeft: '30%' }}
                            />
                          </div>
                          <div className="col-md-2 text-center">
                            <b>Job Name</b>
                            <br />
                            <TextField
                              id="job_site_name"
                              type="text"
                              variant="standard"
                              InputProps={{
                                disableUnderline: true,
                              }}
                              name="job_site_name"
                              value={formUpdateData.job_site_name}
                              onChange={(e) => handleInputChange(undefined, e)}
                              style={{ marginTop: "12px", width: "100%", marginLeft: '16%' }}
                            />
                          </div>
                          <div className="col-md-3 text-center">
                            <b>Job Location</b>
                            <br />
                            <TextField
                              id="job_location"
                              type="text"
                              variant="standard"
                              InputProps={{ disableUnderline: true }}
                              name="job_location"
                              value={formUpdateData.job_location}
                              onChange={(e) => handleInputChange(undefined, e)}
                              style={{ marginTop: "12px", width: "100%", marginLeft: '16%' }}
                            />
                          </div>
                        </div>

                        <div className="line"></div>
                        <div className="row item_details_div">
                          <span className="plus-icon" onClick={handleAddItem}>
                            <i className="fas fa-plus-circle"></i>
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
                    )}
                    <div
                      className="row"
                      style={{ marginTop: index === 0 ? "6%" : "0px" }}
                    >
                      <div className="col-md-2">
                        <TextField
                          id="lot_no"
                          variant="standard"
                          type="text"
                          name="lot_no"
                          value={item.lot_no}
                          onChange={(e) => handleInputChange(index, e)}
                          inputProps={{ style: { width: '100%', maxWidth: '100%' } }}
                          style={{
                            marginTop: '8px',
                            width: `${Math.max(30, Math.min(10 + ((item.lot_no ? item?.lot_no?.length : 0) * 8), 100))}%`
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
                                marginTop: index === 0 ? '6px' : '5px',
                                width: `${Math.min(10 + (item?.description?.length * 2), 100)}%`
                              }}
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
                      <div className="col-md-2 text-center">
                        <TextField
                          id="price_each"
                          variant="standard"
                          type="number"
                          name="price_each"
                          value={formatPrice(item.price_each)}
                          onChange={(e) => handleInputChange(index, e)}
                          style={{ width: "50%", marginTop: "8px" }}
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
                        <p style={{ marginTop: "26px" }}>
                          {`$${((item.quantity || 0) * (item.price_each || 0)).toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                  </>
                ))}
              </div>
              {/* </div> */}

              <div
                className="invoice-last-div px-3"
                style={{
                  marginTop: formUpdateData.items.length === 2
                    ? "800px"
                    : formUpdateData.items.length >= 3 && formUpdateData.items.length <= 5
                      ? "560px"
                      : formUpdateData.items.length >= 6 && formUpdateData.items.length <= 8
                        ? "320px"
                        : formUpdateData.items.length >= 9 && formUpdateData.items.length <= 11
                          ? "130px"
                          : formUpdateData.items.length >= 12 && formUpdateData.items.length <= 14
                            ? "0px"

                            : formUpdateData.items.length > 16
                              ? "70px"
                              : "50px"
                }}
              >
                <p style={{ marginRight: "70px" }}>
                  Total Due: {`$${formUpdateData?.total_amount?.toFixed(2) || ""}`}
                </p>
                <h5 style={{ fontSize: "25px", fontWeight: "600" }}>
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
