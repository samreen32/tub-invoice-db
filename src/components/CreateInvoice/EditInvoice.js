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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import calenderImg from "../../assets/img/ad_calender.png"

function EditInvoice() {
  let navigate = useNavigate();
  const targetRef = useRef();
  const { state } = useLocation();
  const { invoiceNum } = state;
  const { formUpdateData, setFormUpdateData, addresses, descriptions,
    adEstimateAvaiableDatePicker, setAdEstimateAvaiableDatePicker } = UserLogin();
  const [visibleBillToFields, setVisibleBillToFields] = useState(3);
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

  const handleInputChange = (index, e) => {
    const { name, value } = e.target;
    setFormUpdateData((prevData) => {
      if (index !== undefined) {
        const updatedItems = prevData.items.map((item, idx) => {
          if (idx === index) {
            return { ...item, [name]: value };
          }
          return item;
        });

        const totalAmount = updatedItems.reduce((acc, curr) => acc + (curr.quantity * curr.price_each), 0);

        return {
          ...prevData,
          items: updatedItems,
          total_amount: totalAmount,
        };
      } else {
        return {
          ...prevData,
          [name]: value,
        };
      }
    });
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
          console.log(invoiceData.PO_date, "invoice data")
          const validDate = invoiceData.PO_date ? new Date(invoiceData.PO_date) : null;
          setFormUpdateData({
            ...formUpdateData,
            ...invoiceData,
            PO_date: validDate
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


  const handleUpdateInvoiceAndGeneratePDF = async () => {
    const input = document.getElementById('pdf');
    const canvas = await html2canvas(input, { scrollY: -window.scrollY, windowHeight: document.documentElement.offsetHeight });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfPageWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();

    // Define your padding here
    const paddingTopBottom = 0; // 10mm padding for the top and bottom
    const paddingLeftRight = 20; // 20mm padding for the left and right
    const effectivePageWidth = pdfPageWidth - (2 * paddingLeftRight); // Effective page width after subtracting padding
    const pdfWidth = effectivePageWidth;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // Auto calculate the height depending on the width
    const effectivePageHeight = pdfPageHeight - (2 * paddingTopBottom);

    // Adjusted height and width calculation to account for padding
    let heightLeft = pdfHeight + paddingTopBottom; // Start with padding at the top
    let positionX = paddingLeftRight; // Start X position with padding from the left
    let positionY = -paddingTopBottom; // Start Y position drawing the image paddingTopBottom mm higher

    // Add the initial image section with padding
    pdf.addImage(imgData, 'PNG', positionX, positionY, pdfWidth, pdfHeight);
    heightLeft -= effectivePageHeight;

    // Adding new pages if the content overflows
    while (heightLeft >= 0) {
      positionY = heightLeft - pdfHeight - paddingTopBottom; // Adjust position for padding
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', positionX, positionY, pdfWidth, pdfHeight);
      heightLeft -= effectivePageHeight;
    }

    // Adding page numbers in the footer, adjusted for padding
    // Adding page numbers in the footer, adjusted for padding
    for (let i = 1; i <= pdf.internal.getNumberOfPages(); i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      // Increase the Y position margin for the footer to avoid overlapping with content
      const footerMarginBottom = 10; // Adjust this value as needed for adequate spacing
      pdf.text(i + ' of ' + pdf.internal.getNumberOfPages(), pdfPageWidth - 25, pdfPageHeight - footerMarginBottom);
    }


    pdf.save('invoice.pdf');
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
          nextFieldId = `quantity_${currentIndex}`; // Move to 'Quantity' of same item
          break;
        case "quantity":
          nextFieldId = `price_each_${currentIndex}`; // Move to 'Price Each' of same item
          break;
        case "price_each":
          nextIndex = currentIndex + 1; // Move to next item's 'Lot No'
          if (nextIndex >= formUpdateData.items.length) {
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
                  Fax: (702) 445-6241
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
            <div className="row bill_to_div px-3" style={{ border: "2px solid white" }}>
              <div className="col-md-9">
                <p>
                  <b>Bill To</b> <br /><br />
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
                                style={{ marginTop: "-20px", width: "50%", marginBottom: "15px" }}
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
                    id="PO_date"
                    variant="standard"
                    placeholder="mm/dd/yyyy"
                    type="text"
                    style={{ width: "75%", marginTop: "23px", }}
                    InputProps={{
                      endAdornment: (
                        <img
                          src={calenderImg}
                          alt='calendar'
                          onClick={() => setAdEstimateAvaiableDatePicker(true)}
                          style={{ cursor: 'pointer', }}
                        />
                      ),
                      disableUnderline: true
                    }}
                    value={formatDate(formUpdateData.PO_date)}
                  />
                  {adEstimateAvaiableDatePicker && (
                    <div style={{ position: 'absolute', zIndex: 1000 }}>
                      <DatePicker
                        selected={formUpdateData.PO_date}
                        onChange={(date) => {
                          setFormUpdateData({ ...formUpdateData, PO_date: date });
                          setAdEstimateAvaiableDatePicker(false);
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

                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = "white"}
                    onBlur={(e) => e.target.style.borderBottomColor = "#ccc"}
                  />

                </div>
              </div>

              <div className="line"></div>
              <div className="row item_details_div px-3 mt-3">
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
                                  Fax: (702) 445-6241
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
                          <div className="row bill_to_div " style={{ border: "2px solid white" }}>
                            <div className="col-md-9">
                              <p>
                                <b>Bill To</b> <br /><br />
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
                                              style={{ marginTop: "-20px", width: "55%", marginBottom: "15px" }}
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
                                id="PO_date"
                                variant="standard"
                                placeholder="mm/dd/yyyy"
                                type="text"
                                style={{ width: "75%", marginTop: "23px", }}
                                InputProps={{
                                  endAdornment: (
                                    <img
                                      src={calenderImg}
                                      alt='calendar'
                                      onClick={() => setAdEstimateAvaiableDatePicker(true)}
                                      style={{ cursor: 'pointer', }}
                                    />
                                  ),
                                  disableUnderline: true
                                }}
                                value={formatDate(formUpdateData.PO_date)}
                              />
                              {adEstimateAvaiableDatePicker && (
                                <div style={{ position: 'absolute', zIndex: 1000 }}>
                                  <DatePicker
                                    selected={formUpdateData.PO_date}
                                    onChange={(date) => {
                                      setFormUpdateData({ ...formUpdateData, PO_date: date });
                                      setAdEstimateAvaiableDatePicker(false);
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
                      style={{ marginTop: index === 0 ? "6%" : "0px", }}
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
                          // onKeyDown={(event) =>
                          //   handleEnterKeyPress(event, "lot_no", index)
                          // }
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
                                marginTop: index === 0 ? '-5px' : '-5px',
                                width: "100%"
                              }}
                              // InputProps={{
                              //   disableUnderline: true
                              // }}
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
                          style={{ width: "100%", marginTop: "8px", marginLeft: "30px" }}
                          onKeyDown={(event) =>
                            handleEnterKeyPress(event, "quantity", index)
                          }
                        />
                      </div>
                      <div className="col-md-2 text-center">
                        <TextField
                          id={`price_each_${index}`}
                          variant="standard"
                          type="text"
                          name="price_each"
                          value={formatPrice(item.price_each)}
                          onChange={(e) => handleInputChange(index, e)}
                          onKeyDown={(event) => handleEnterKeyPress(event, "price_each", index)}
                          style={{ width: "55%", marginTop: "8px" }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="center">
                                <span
                                  style={{
                                    marginRight: 'auto', marginLeft: '10px',
                                    fontSize: '1.4rem', color: "black"
                                  }}
                                >
                                  $
                                </span>
                              </InputAdornment>
                            ),
                            style: { justifyContent: 'center' }
                          }}
                          inputProps={{
                            style: { textAlign: 'center' }
                          }}
                        />
                      </div>
                      <div
                        className="col-md-1"
                        style={{
                          marginLeft: "-50px", width: "150px", textAlign: "center"
                        }}
                      >
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
                              ? "60px"
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
      </div>
    </div>
  );
}

export default EditInvoice;
