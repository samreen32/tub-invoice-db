import React, { useEffect, useState } from "react";
import { UserLogin } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router";
import { INVOICE } from "../../Auth_API";
import axios from "axios";
import Swal from "sweetalert2";
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';

function InvoiceForm() {
  let navigate = useNavigate();
  const { formData, setFormData, addresses, descriptions } = UserLogin();
  const [visibleBillToFields, setVisibleBillToFields] = useState(1);
  const [focusedField, setFocusedField] = useState(null);

  /* Input field validation */
  const handleInputChange = (index, e) => {
    const { name, value } = e?.target || {};

    setFormData((prevData) => {
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

  const handleAddItem = () => {
    setFormData((prevData) => ({
      ...prevData,
      items: [
        ...prevData.items,
        {
          lot_no: "",
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
    navigate("/main");
  };

  const updateBillToField = (index, value) => {
    setFormData((prevData) => {
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
      <div className="container px-5 py-3" style={{ width: "100%", marginTop: "-50px" }}>
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
                  Office: (702)445-6232 <br />
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
              <>
                <div className="col-md-9">
                  <p>
                    <b>Bill To </b> <br />
                    {[1, 2, 3].map(
                      (fieldIndex) =>
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
                                  onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex - 1)}
                                  style={{ marginTop: "-20px", width: "80%" }}
                                />
                              )}
                            />
                            <br />
                          </React.Fragment>
                        )
                    )}
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
                    />
                  </p>
                </div>
              </>
            </div>

            <div className="last-row mt-2">
              <div className="row po_details_div px-3">
                <div className="col-md-1">
                  <b>PO No.</b>
                  <br />
                  <TextField
                    id="po_num"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="PO_number"
                    value={formData.PO_number}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%" }}
                  />
                </div>
                <div className="col-md-2">
                  <b>PO Date</b>
                  <br />
                  <TextField
                    id="po_date"
                    type="date"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="PO_date"
                    value={formData.PO_date}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "80%" }}
                  />
                </div>
                <div className="col-md-2">
                  <b>Job Site No.</b>
                  <br />
                  <TextField
                    id="job_site_no"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="job_site_num"
                    value={formData.job_site_num}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%" }}
                  />
                </div>
                <div className="col-md-2">
                  <b>Type of Work</b>
                  <br />
                  <TextField
                    id="type_of_work"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="type_of_work"
                    value={formData.type_of_work}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%" }}
                  />
                </div>
                <div className="col-md-2">
                  <b>Job Name</b>
                  <br />
                  <TextField
                    id="job_site_name"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="job_site_name"
                    value={formData.job_site_name}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%" }}
                  />
                </div>
                <div className="col-md-3">
                  <b>Job Location</b>
                  <br />
                  <TextField
                    id="job_location"
                    type="text"
                    variant="standard"
                    InputProps={{ disableUnderline: true }}
                    name="job_location"
                    value={formData.job_location}
                    onChange={(e) => handleInputChange(undefined, e)}
                    style={{ marginTop: "12px", width: "100%" }}
                  />
                </div>
              </div>

              <div className="line"></div>

              <div className="row item_details_div px-3">
                <span className="plus-icon" onClick={handleAddItem}>
                  <i className="fas fa-plus-circle"></i>
                </span>&nbsp;
                <div className="col-md-2">
                  <b>Lot No.</b>
                </div>
                <div className="col-md-6">
                  &nbsp;<b>Description</b>
                </div>
                <div className="col-md-1" style={{ marginLeft: "-40px" }}><b>Quantity</b></div>
                <div className="col-md-2" style={{ marginLeft: "12px" }}><b>Price Each</b></div>
                <div className="col-md-1" style={{ marginLeft: "-65px" }}> <b>Amount</b></div>
              </div>
              {/* <div style={{ overflowY: 'auto', overflowX: "hidden", height: '400px' }}> */}
              <div className="row item_details_div px-3" style={{ marginTop: "-65px" }}>
                {formData.items.map((item, index) => (
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
                        style={{ width: "100%", marginTop: "8px" }}
                        onChange={(e) => handleInputChange(index, e)}
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
                            style={{ width: "100%", marginTop: "-6px" }}
                          />
                        )}
                      />
                    </div>

                    <div className="col-md-1">
                      <TextField
                        id="quantity"
                        variant="standard"
                        type="number"
                        name="quantity"
                        value={item.quantity}
                        onChange={(e) => handleInputChange(index, e)}
                        style={{ width: "100%", marginTop: "8px" }}
                      />
                    </div>  
                    <div className="col-md-2">
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
                    <div className="col-md-1" style={{ marginLeft: "-50px", width: "150px" }}>
                      <p style={{ marginTop: "26px" }}>
                        {`$ ${((item.quantity || 0) * (item.price_each || 0)).toFixed(2)}`}
                      </p>
                    </div>

                  </div>
                ))}

              </div>
              {/* </div> */}

              <div className="invoice-last-div ">
                <p style={{ marginRight: "100px", marginTop: "30px" }}>
                  <span>Total Due: </span>
                  {`$${formData?.total_amount?.toFixed(2) || ""}`}
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InvoiceForm;
