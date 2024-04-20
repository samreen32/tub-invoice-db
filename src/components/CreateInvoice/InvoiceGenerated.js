import React, { useEffect, useRef, useState } from "react";
import { UserLogin } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import { useNavigate } from "react-router";
import generatePDF from "react-to-pdf";
import TextField from "@mui/material/TextField";
import InputAdornment from '@mui/material/InputAdornment';

function InvoiceGenerated() {
  let navigate = useNavigate();
  const { formData, setFormData } = UserLogin();
  const targetRef = useRef();
  const [visibleBillToFields, setVisibleBillToFields] = useState(3);
  const [focusedField, setFocusedField] = useState(null);

  const handleGenerateNew = () => {
    setFormData({
      installer: "",
      bill_to: [""],
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
    navigate("/estimate");
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


  function formatDate(dateString) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${month}-${day}-${year}`;
  }

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(2);
  };

  const baseInvoiceSectionStyle = {
    marginTop: "190px",
    border: "2px solid white",
    // height: "1200px"
  };

  return (
    <div id="invoice-generated">
      <div className="row">
        <div className="col-3" style={{ marginTop: "40px" }}>
          <div className="add-container">
            <span onClick={() => {
              navigate("/main")
            }}
              className="new-invoice-btn" style={{ marginRight: "20px", background: "grey" }}
            >
              <i class="fas fa-home fa-1x"></i>
            </span>

            <span onClick={handleGenerateNew} className="new-invoice-btn">
              New estimate
            </span>
          </div>
        </div>
        <div className="col-6">
          <h2>Estimate Details</h2>
        </div>
        <div className="col-3" style={{ marginTop: "50px" }}>
          <span
            onClick={() => generatePDF(targetRef, { filename: "estimate.pdf" })}
            className="new-invoice-btn"
            style={{ background: "green", border: "none" }}
          >
            Generate PDF
            {/* <i class="fa fa-download fa-2x" aria-hidden="true"></i> */}
          </span>
        </div>
      </div>

      <div
        className="container h-100 px-5 py-5"
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
                <b>Estimate</b>
              </p>
              <p>
                Number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {formData.invoice && formData.invoice.invoice_num
                  ? formData.invoice.invoice_num
                  : ""}
              </p>

              <p>
                Date
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {formData.invoice && formData.invoice.date
                  ? new Date(formData.invoice.date).toLocaleDateString()
                  : ""}
              </p>
            </div>
          </div>

          <div className="row bill_to_div px-3" style={{ width: "50%", border: "2px solid white" }}>
            <div className="col-md-9">
              <p>
                <b>Bill To</b> <br />
                {[1, 2, 3].map((fieldIndex) => (
                  fieldIndex <= visibleBillToFields && (
                    <React.Fragment key={`bill_to_${fieldIndex}`}>
                      <TextField
                        variant="standard"
                        value={formData.bill_to[fieldIndex - 1]}
                        onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex - 1)}
                        style={{ marginTop: "2px" }}
                        readOnly
                        InputProps={{
                          disableUnderline: true
                        }}
                      />
                    </React.Fragment>
                  )
                ))}
              </p>
            </div>
          </div>

          <div className="last-row" style={{ marginTop: "-10px" }}>
            <div className="row po_details_div px-3">
              <div className="col-md-1 text-center">
                <b>PO No.</b>
                <br />
                <div className="my-2">
                  {formData.PO_number}
                </div>
              </div>
              <div className="col-md-2 text-center">
                <b>PO Date</b>
                <br />
                <div className="mt-3">
                  {formatDate(formData.PO_date)}
                </div>
              </div>
              <div className="col-md-2 text-center">
                <b>Type of Work</b>
                <br />
                <div className="mt-3">
                  {formData.type_of_work}
                </div>
              </div>
              <div className="col-md-2 text-center">
                <b>Job Site No.</b>
                <br />
                <div className="mt-3">
                  {formData.job_site_num}
                </div>
              </div>
              <div className="col-md-2 text-center">
                <b>Job Name</b>
                <br />
                <div className="mt-3">
                  {formData.job_site_name}
                </div>
              </div>
              <div className="col-md-3 text-center">
                <b>Job Location</b>
                <br />
                <div className="mt-3">
                  {formData.job_location}
                </div>
              </div>
            </div>

            <div className="line my-3"></div>
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
            <div className="row item_details_div px-3" style={{ marginTop: "-65px" }}>
              {formData.items.map((item, index) => (
                <>
                  {(index + 1) % 16 === 0 && (
                    <>
                      <h5 className="text-center"
                        style={{
                          fontSize: "25px",
                          fontWeight: "600",
                          marginBottom: "-40px"
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
                              <b>Estimate</b>
                            </p>
                            <p>
                              Number &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              {formData.invoice && formData.invoice.invoice_num
                                ? formData.invoice.invoice_num
                                : ""}
                            </p>

                            <p>
                              Date
                              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              {formData.invoice && formData.invoice.date
                                ? new Date(formData.invoice.date).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                        </div>

                        <div className="row bill_to_div " style={{ width: "50%", border: "2px solid white" }}>
                          <div className="col-md-9">
                            <p>
                              <b>Bill To</b> <br />
                              {[1, 2, 3].map((fieldIndex) => (
                                fieldIndex <= visibleBillToFields && (
                                  <React.Fragment key={`bill_to_${fieldIndex}`}>
                                    <TextField
                                      variant="standard"
                                      value={formData.bill_to[fieldIndex - 1]}
                                      onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex - 1)}
                                      style={{ marginTop: "2px" }}
                                      readOnly
                                      InputProps={{
                                        disableUnderline: true
                                      }}
                                    />
                                  </React.Fragment>
                                )
                              ))}
                            </p>
                          </div>
                        </div>

                        <div className="row po_details_div">
                          <div className="col-md-1 text-center">
                            <b>PO No.</b>
                            <br />
                            <div className="my-2">
                              {formData.PO_number}
                            </div>
                          </div>
                          <div className="col-md-2 text-center">
                            <b>PO Date</b>
                            <br />
                            <div className="mt-3">
                              {formatDate(formData.PO_date)}
                            </div>
                          </div>
                          <div className="col-md-2 text-center">
                            <b>Type of Work</b>
                            <br />
                            <div className="mt-3">
                              {formData.type_of_work}
                            </div>
                          </div>
                          <div className="col-md-2 text-center">
                            <b>Job Site No.</b>
                            <br />
                            <div className="mt-3">
                              {formData.job_site_num}
                            </div>
                          </div>
                          <div className="col-md-2 text-center">
                            <b>Job Name</b>
                            <br />
                            <div className="mt-3">
                              {formData.job_site_name}
                            </div>
                          </div>
                          <div className="col-md-3 text-center">
                            <b>Job Location</b>
                            <br />
                            <div className="mt-3">
                              {formData.job_location}
                            </div>
                          </div>
                        </div>

                        <div className="line"></div>
                        <div className="row item_details_div">
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
                      </div>
                    </>
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
                        // inputProps={{ style: { width: '100%', maxWidth: '100%' } }}
                        style={{ marginTop: '0px', width: `${Math.min((item?.lot_no?.length * 5) + 10, 100)}%` }}
                        aria-readonly
                        InputProps={{
                          disableUnderline: true
                        }}
                      />
                    </div>
                    <div className="col-md-6">
                      <TextField
                        id="description"
                        variant="standard"
                        type="text"
                        name="description"
                        value={item.description}
                        aria-readonly
                        inputProps={{ style: { width: '100%', maxWidth: '100%' } }}
                        style={{ marginTop: '-8px', width: `${Math.min(10 + (item?.description?.length * 2), 100)}%` }}
                        InputProps={{
                          disableUnderline: true
                        }}
                      />
                    </div>
                    <div className="col-md-1 text-center">
                      <TextField
                        id="quantity"
                        variant="standard"
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        aria-readonly
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
                        type="text"
                        name="price_each"
                        value={formatPrice(item.price_each)}
                        aria-readonly
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
                    <div className="col-md-1"
                      style={{
                        marginLeft: "-50px", width: "150px", textAlign: "center"
                      }}
                    >
                      <p style={{ marginTop: "26px" }}>
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
                            ? "0px"
                            : formData.items.length > 17
                              ? "0px"
                              : "50px"
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
                marginTop: "-50px"
              }}>
                Thank You! We truly appreciate your business!
              </h5>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

export default InvoiceGenerated;
