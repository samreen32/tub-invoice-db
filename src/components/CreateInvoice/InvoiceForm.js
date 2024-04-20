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
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import calenderImg from "../../assets/img/ad_calender.png"

function InvoiceForm() {
  let navigate = useNavigate();
  const { formData, setFormData, addresses, descriptions } = UserLogin();
  const [visibleBillToFields, setVisibleBillToFields] = useState(1);
  const [focusedField, setFocusedField] = useState(null);
  const createDefaultItems = (numItems = 15) => {
    return Array.from({ length: numItems }, () => ({
      lot_no: "",
      description: "",
      quantity: 0,
      price_each: 0,
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

    setFormData((prevData) => {
      // Check if an index is provided, indicating an update to the items array
      if (index !== undefined) {
        // Copy items to a new array for immutability
        const updatedItems = prevData.items.map((item, idx) => {
          // Update the item at the specified index
          if (idx === index) {
            return { ...item, [name]: value };
          }
          return item; // Return unchanged items
        });

        // Calculate the new total amount based on changes in items
        const totalAmount = updatedItems.reduce((total, item) => {
          return total + (parseFloat(item.quantity || 0) * parseFloat(item.price_each || 0));
        }, 0);

        // Return the updated formData object with the new items and total amount
        return {
          ...prevData,
          items: updatedItems,
          total_amount: totalAmount, // Update the total amount based on item calculations
        };
      } else {
        // Handle updates to fields outside of the items array
        return {
          ...prevData,
          [name]: value,
        };
      }
    });
  };


  // const handleInputChange = (index, event) => {
  //   const { name, value } = event.target;
  //   setFormData(prevData => ({
  //     ...prevData,
  //     [name]: value
  //   }));
  //   const newItems = formData.items.map((item, idx) => {
  //     if (idx === index) {
  //       return { ...item, [event.target.name]: event.target.value };
  //     }
  //     return item;
  //   });
  //   setFormData({ ...formData, items: newItems });
  // };

  const handleAddItem = () => {
    const newItems = Array.from({ length: 15 }, () => ({
      lot_no: "",
      description: "",
      quantity: 0,
      price_each: 0,
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
    // Setting focus to the new last `lot_no` field after items are added
    const lastIndex = formData.items.length - 1;
    if (inputRefs.current[lastIndex]) {
      inputRefs.current[lastIndex].focus();
    }
  }, [formData.items.length]);

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

  const baseInvoiceSectionStyle = {
    marginTop: "126px",
    border: "2px solid white",
    // height: "1200px"
  };

  return (
    // <div id="invoice-generated">
    //   <div style={{ display: "flex", marginBottom: "50px" }}>
    //     <h2>
    //       <span
    //         onClick={handleGenerateNew}
    //         style={{ cursor: "pointer", marginLeft: "-40%" }}
    //       >
    //         <i class="fa fa-chevron-left fa-1x" aria-hidden="true"></i>
    //       </span>
    //       <span style={{ cursor: "pointer", marginLeft: "40%" }}>
    //         <b>Please enter your details</b>
    //       </span>
    //     </h2>
    //   </div>
    //   <div className="container px-5 py-3" style={{ width: "100%", marginTop: "-50px" }}>
    //     <div id="pdf">
    //       <div className="row">
    //         <div className="invoice-first-div col-8 px-5">
    //           <img src={logo} alt="logo tub" />
    //           <address className="mt-3 px-3">
    //             <b style={{ fontSize: "28px" }}>Tub Pro's, Inc. </b>
    //             <br />
    //             <span style={{ fontSize: "22px" }}>
    //               PO Box 30596 <br />
    //               Las Vegas, NV. 89173 <br />
    //               Office: (702)445-6232 <br />
    //               Fax: (702) 445-6241
    //             </span>
    //           </address>
    //         </div>
    //         <div className="col-4">
    //           <span
    //             onClick={handleCreateInvoice}
    //             style={{ float: "right", cursor: "pointer" }}
    //           >
    //             <button className="mt-4 px-3 py-2"
    //               style={{ background: "green", color: "white", border: "none" }}
    //             >Generate</button>
    //             {/* <i class="fa fa-chevron-right fa-lg" aria-hidden="true"></i> */}
    //           </span>
    //         </div>
    //       </div>

    //       <form>
    //         <div className="row bill_to_div px-3" style={{ border: "2px solid white" }}>
    //           <>
    //             <div className="col-md-9">
    //               <p>
    //                 <b>Bill To </b> <br />
    //                 {[1, 2, 3].map(
    //                   (fieldIndex) =>
    //                     fieldIndex <= visibleBillToFields && (
    //                       <React.Fragment key={`bill_to_${fieldIndex}`}>
    //                         <Autocomplete
    //                           freeSolo
    //                           options={addresses}
    //                           value={formData.bill_to[fieldIndex - 1] || ''}
    //                           onChange={(event, newValue) => {
    //                             updateBillToField(fieldIndex - 1, newValue);
    //                           }}
    //                           onInputChange={(event, newInputValue) => {
    //                             updateBillToField(fieldIndex - 1, newInputValue);
    //                           }}
    //                           renderInput={(params) => (
    //                             <TextField
    //                               {...params}
    //                               variant="standard"
    //                               onKeyDown={(e) => handleBillToEnterKey(e, fieldIndex - 1)}
    //                               style={{ marginTop: "-20px", width: "80%" }}
    //                             />
    //                           )}
    //                         />
    //                         <br />
    //                       </React.Fragment>
    //                     )
    //                 )}
    //               </p>
    //             </div>

    //             <div className="col-md-3">
    //               <p>
    //                 <b>Installer</b>  <br />
    //                 <TextField
    //                   id="installer"
    //                   type="text"
    //                   variant="standard"
    //                   name="installer"
    //                   value={formData.installer}
    //                   onChange={(e) => handleInputChange(undefined, e)}
    //                 />
    //               </p>
    //             </div>
    //           </>
    //         </div>

    //         <div className="last-row mt-2">
    //           <div className="row po_details_div px-3">
    //             <div className="col-md-1">
    //               <b>PO No.</b>
    //               <br />
    //               <TextField
    //                 id="po_num"
    //                 type="text"
    //                 variant="standard"
    //                 InputProps={{ disableUnderline: true }}
    //                 name="PO_number"
    //                 value={formData.PO_number}
    //                 onChange={(e) => handleInputChange(undefined, e)}
    //                 style={{ marginTop: "12px", width: "100%" }}
    //               />
    //             </div>
    //             <div className="col-md-2">
    //               <b>PO Date</b>
    //               <br />
    //               <TextField
    //                 id="po_date"
    //                 type="date"
    //                 variant="standard"
    //                 InputProps={{ disableUnderline: true }}
    //                 name="PO_date"
    //                 value={formData.PO_date}
    //                 onChange={(e) => handleInputChange(undefined, e)}
    //                 style={{ marginTop: "12px", width: "80%" }}
    //               />
    //             </div>
    //             <div className="col-md-2">
    //               <b>Job Site No.</b>
    //               <br />
    //               <TextField
    //                 id="job_site_no"
    //                 type="text"
    //                 variant="standard"
    //                 InputProps={{ disableUnderline: true }}
    //                 name="job_site_num"
    //                 value={formData.job_site_num}
    //                 onChange={(e) => handleInputChange(undefined, e)}
    //                 style={{ marginTop: "12px", width: "100%" }}
    //               />
    //             </div>
    //             <div className="col-md-2">
    //               <b>Type of Work</b>
    //               <br />
    //               <TextField
    //                 id="type_of_work"
    //                 type="text"
    //                 variant="standard"
    //                 InputProps={{ disableUnderline: true }}
    //                 name="type_of_work"
    //                 value={formData.type_of_work}
    //                 onChange={(e) => handleInputChange(undefined, e)}
    //                 style={{ marginTop: "12px", width: "100%" }}
    //               />
    //             </div>
    //             <div className="col-md-2">
    //               <b>Job Name</b>
    //               <br />
    //               <TextField
    //                 id="job_site_name"
    //                 type="text"
    //                 variant="standard"
    //                 InputProps={{ disableUnderline: true }}
    //                 name="job_site_name"
    //                 value={formData.job_site_name}
    //                 onChange={(e) => handleInputChange(undefined, e)}
    //                 style={{ marginTop: "12px", width: "100%" }}
    //               />
    //             </div>
    //             <div className="col-md-3">
    //               <b>Job Location</b>
    //               <br />
    //               <TextField
    //                 id="job_location"
    //                 type="text"
    //                 variant="standard"
    //                 InputProps={{ disableUnderline: true }}
    //                 name="job_location"
    //                 value={formData.job_location}
    //                 onChange={(e) => handleInputChange(undefined, e)}
    //                 style={{ marginTop: "12px", width: "100%" }}
    //               />
    //             </div>
    //           </div>

    //           <div className="line"></div>

    //           <div className="row item_details_div px-3">
    //             <span className="plus-icon" onClick={handleAddItem}>
    //               {/* <i className="fas fa-plus-circle"></i> */}
    //             </span>&nbsp;
    //             <div className="col-md-2">
    //               <b>Lot No.</b>
    //             </div>
    //             <div className="col-md-6">
    //               &nbsp;<b>Description</b>
    //             </div>
    //             <div className="col-md-1" style={{ marginLeft: "-40px" }}><b>Quantity</b></div>
    //             <div className="col-md-2" style={{ marginLeft: "12px" }}><b>Price Each</b></div>
    //             <div className="col-md-1" style={{ marginLeft: "-65px" }}> <b>Amount</b></div>
    //           </div>
    //           {/* <div style={{ overflowY: 'auto', overflowX: "hidden", height: '400px' }}> */}
    //           <div className="row item_details_div px-3" style={{ marginTop: "-65px" }}>
    //             {formData.items.map((item, index) => (
    //               <div
    //                 className="row"
    //                 style={{ marginTop: index === 0 ? "6%" : "0px" }}
    //               >
    //                 <div className="col-md-2">
    //                   <TextField
    //                     key={index}
    //                     variant="standard"
    //                     name="lot_no"
    //                     value={item.lot_no}
    //                     onChange={(e) => setFormData({
    //                       ...formData,
    //                       items: formData.items.map((item, idx) => idx === index ? { ...item, [e.target.name]: e.target.value } : item)
    //                     })}
    //                     onKeyPress={(e) => handleLotNoKeyPress(e, index)}
    //                     style={{ width: "100%", marginTop: "8px" }}
    //                     InputProps={{ disableUnderline: true }}
    //                   />
    //                 </div>
    //                 <div className="col-md-6">
    //                   <Autocomplete
    //                     freeSolo
    //                     options={descriptions}
    //                     value={item.description || ''}
    //                     onChange={(event, newValue) => {
    //                       handleInputChange(index, {
    //                         target: {
    //                           name: 'description',
    //                           value: newValue,
    //                         },
    //                       });
    //                     }}
    //                     onInputChange={(event, newInputValue, reason) => {
    //                       if (reason === 'input') {
    //                         handleInputChange(index, {
    //                           target: {
    //                             name: 'description',
    //                             value: newInputValue,
    //                           },
    //                         });
    //                       }
    //                     }}
    //                     renderInput={(params) => (
    //                       <TextField
    //                         {...params}
    //                         variant="standard"
    //                         style={{ width: "100%", marginTop: "-6px" }}
    //                       />
    //                     )}
    //                   />
    //                 </div>

    //                 <div className="col-md-1">
    //                   <TextField
    //                     id="quantity"
    //                     variant="standard"
    //                     type="number"
    //                     name="quantity"
    //                     value={item.quantity}
    //                     onChange={(e) => handleInputChange(index, e)}
    //                     style={{ width: "100%", marginTop: "8px" }}
    //                   />
    //                 </div>
    //                 <div className="col-md-2">
    //                   <TextField
    //                     id="price_each"
    //                     variant="standard"
    //                     type="number"
    //                     name="price_each"
    //                     value={formatPrice(item.price_each)}
    //                     onChange={(e) => handleInputChange(index, e)}
    //                     style={{ width: "50%", marginTop: "8px" }}
    //                     InputProps={{
    //                       startAdornment: (
    //                         <InputAdornment position="start">
    //                           <span style={{ fontSize: '1.4rem', color: "black" }}>$</span>
    //                         </InputAdornment>
    //                       ),
    //                     }}
    //                   />
    //                 </div>
    //                 <div className="col-md-1" style={{ marginLeft: "-50px", width: "150px" }}>
    //                   <p style={{ marginTop: "26px" }}>
    //                     {`$ ${((item.quantity || 0) * (item.price_each || 0)).toFixed(2)}`}
    //                   </p>
    //                 </div>

    //               </div>
    //             ))}

    //           </div>
    //           {/* </div> */}

    //           <div className="invoice-last-div ">
    //             <p style={{ marginRight: "100px", marginTop: "30px" }}>
    //               <span>Total Due: </span>
    //               {`$${formData?.total_amount?.toFixed(2) || ""}`}
    //             </p>
    //           </div>
    //         </div>
    //       </form>
    //     </div>
    //   </div>
    // </div>

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
              <div className="col-md-9">
                <p>
                  <b>Bill To</b> <br /><br />
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
                  <br />
                  <input
                    id="po_num"
                    type="text"
                    name="PO_number"
                    value={formData.PO_number}
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
                    id="PO_date"
                    name="PO_date"
                    type="date"
                    variant="standard"
                    placeholder="mm/dd/yyyy"
                    style={{ width: "75%", marginTop: "30px" }}
                    InputProps={{
                      disableUnderline: true
                    }}
                    value={formData.PO_date || ''}
                    onChange={(e) => handleInputChange(undefined, e)}
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
                                value={formData.PO_number}
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
