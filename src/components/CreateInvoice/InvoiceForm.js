import React, { useEffect, useRef, useState } from "react";
import { UserLogin } from "../../context/AuthContext";
import logo from "../../assets/img/logo.png";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router";
import { FETCH_BILL_TO, FETCH_DESCRIPPTION, INVOICE } from "../../Auth_API";
import axios from "axios";
import Swal from "sweetalert2";
import Autocomplete from '@mui/material/Autocomplete';
import 'react-datepicker/dist/react-datepicker.css';
import { divideArrayIntoChunks } from "../../utils";

const CHUNK_SIZE = 31;

function InvoiceForm() {
  let navigate = useNavigate();
  const { formData, setFormData, addresses, descriptions, setDescriptions, setAddresses } = UserLogin();
  const [visibleBillToFields, setVisibleBillToFields] = useState(1);

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
        if (response.data) {
          setDescriptions(response.data.map(item => ({ label: item })));
        } else {
          setDescriptions([]);
        }
      } catch (error) {
        console.error('Failed to fetch descriptions:', error);
        setDescriptions([]);
      }
    };

    fetchDescriptions();
  }, []);


  const createDefaultItems = (numItems = 31) => {
    return Array.from({ length: numItems }, () => ({
      lot_no: "",
      description: "",
      quantity: "",
      price_each: "",
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
    setFormData(prevData => ({
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
      let numericValue = String(value).replace(/[^0-9.]/g, '');

      if (numericValue.length === 4 && !numericValue.includes('.')) {
        numericValue += ".00";
      }

      const dotIndex = numericValue.indexOf('.');
      if (dotIndex === -1 && numericValue.length > 4) {
        numericValue = numericValue.slice(0, 4) + '.' + numericValue.slice(4);
      } else if (dotIndex > 4) {
        numericValue = numericValue.slice(0, 4) + '.' + numericValue.slice(4);
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
          const priceEach = parseFloat(item.price_each || 0);
          return total + (parseFloat(item.quantity || 0) * priceEach);
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
    const newItems = createDefaultItems();
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

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, formData.items.length);
  }, [formData.items]);

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


  const updateBillToField = (index, value) => {
    setFormData((prevData) => {
      const updatedBillTo = [...prevData.bill_to];
      updatedBillTo[index] = value || '';
      return { ...prevData, bill_to: updatedBillTo };
    });
  };

  /* Endpoint integration */
  const handleCreateInvoice = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post(`${INVOICE}`, formData);
      console.log("Estimate generated successfully:", response.data);
      navigate(`/estimate_generated`);
      console.log(response, "hsgfjsdfs");
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

  const baseInvoiceSectionStyle = {
    marginTop: "200px",
  };

  const handleEnterKeyPress = (event, currentField, currentIndex) => {
    if (event.key === "Enter") {
      event.preventDefault();

      let nextFieldId;
      let nextIndex = currentIndex;
      switch (currentField) {
        case "installer":
          nextFieldId = "PO_number";
          break;
        case "PO_number":
          nextFieldId = "PO_date";
          break;
        case "PO_date":
          nextFieldId = "type_of_work";
          break;
        case "type_of_work":
          nextFieldId = "job_site_num";
          break;
        case "job_site_num":
          nextFieldId = "job_site_name";
          break;
        case "job_site_name":
          nextFieldId = "job_location";
          break;
        case "job_location":
          nextFieldId = `lot_no_0`;
          break;
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
          if (currentIndex === formData.items.length - 1) {
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

  const handleInputBlur = (index, e) => {
    const { name, value } = e.target;
    if (name === 'price_each') {
      const formattedValue = formatPriceEach(value);
      setFormData((prevData) => {
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
    let numericValue = String(value).replace(/[^0-9.]/g, '');

    if (numericValue === "") {
      return "";
    }
    const dotIndex = numericValue.indexOf('.');
    if (numericValue.length <= 4 && dotIndex === -1) {
      numericValue += ".00";
    } else if (dotIndex !== -1 && dotIndex > 4) {
      numericValue = numericValue.slice(0, 4) + '.' + numericValue.slice(4);
    }

    return numericValue;
  };

  const chunkedArray = () => {
    return divideArrayIntoChunks(formData, CHUNK_SIZE);
  };

  console.log("formData sent to API:", formData);


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
        <div id='pdf'>
          <form>
            <div>
              <div className='row item_details_div px-3'>
                {chunkedArray().map((outerItem, index) => (
                  <>
                    <div
                      style={
                        index !== 0
                          ? baseInvoiceSectionStyle
                          : { border: '2px solid white' }
                      }
                    >
                      <div className='row' style={{ marginTop: "-20px" }}>
                        <div className='invoice-first-div col-8'>
                          <img src={logo} alt='logo tub' />
                          <address className='mt-3 px-3'>
                            <b style={{ fontSize: '28px' }}>Tub Pro's, Inc. </b>
                            <br />
                            <span style={{ fontSize: '22px' }}>
                              PO Box 30596 <br />
                              Las Vegas, NV. 89173 <br />
                              Office: (702) 445-6232 <br />
                              Fax: &nbsp;&nbsp;&nbsp;&nbsp;(702) 445-6241
                            </span>
                          </address>
                        </div>
                        <div className='col-4'>
                          {index === 0 && (
                            <span
                              onClick={(e) => handleCreateInvoice(e)}
                              style={{ float: 'right', cursor: 'pointer' }}
                            >
                              <button
                                className='mt-4 px-3 py-2'
                                style={{
                                  background: 'green',
                                  color: 'white',
                                  border: 'none',
                                }}
                              >
                                Generate
                              </button>
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                    <div className="row bill_to_div" style={{ border: "2px solid white" }}>
                      <div className="col-md-9">
                        <p>
                          <span style={{ fontWeight: "700", marginLeft: "0px" }}>Bill To</span>
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
                                      style={{ marginTop: "-20px", width: "100%", }}
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
                            onKeyDown={(event) => handleEnterKeyPress(event, 'installer')}
                            InputProps={{
                              disableUnderline: true
                            }}
                          />
                        </p>
                      </div>
                    </div>

                    <div className='last-row'>
                      <div className='row po_details_div'>
                        <div className='col-md-1 '>
                          <span style={{ fontWeight: "700", marginLeft: "7px" }}>PO No.</span>
                          {/* <br /> */}
                          <input
                            id='PO_number'
                            type='text'
                            name='PO_number'
                            value={formData.PO_number}
                            onChange={(e) => handleInputChange(undefined, e)}
                            onKeyDown={(event) => handleEnterKeyPress(event, 'PO_number')}
                            style={{
                              marginTop: "12px",
                              width: '120%',
                              border: 'none',
                              textAlign: 'center',
                              outline: 'none',
                              borderBottom: 'none',
                              marginLeft: "-7px"
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderBottomColor = 'white')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderBottomColor = '#ccc')
                            }
                            autoComplete='off'
                          />
                        </div>
                        <div className='col-md-2 text-center'>
                          <b>PO Date</b>
                          <br />
                          <TextField
                            id="PO_date"
                            variant="standard"
                            placeholder="mm/dd/yyyy"
                            type="text"
                            autoComplete='off'
                            style={{ width: "75%", marginTop: "23px", marginLeft: "30px" }}
                            InputProps={{
                              disableUnderline: true
                            }}
                            value={formData.PO_date || ""}
                            onChange={handleDateChange}
                            onKeyDown={(event) => handleEnterKeyPress(event, 'PO_date')}
                          />
                        </div>
                        <div
                          className='col-md-2'
                          style={{ textAlign: 'center' }}
                        >
                          <b>Type of Work</b>
                          <br />
                          <input
                            id='type_of_work'
                            type='text'
                            name='type_of_work'
                            value={formData.type_of_work}
                            autoComplete='off'
                            onChange={(e) => handleInputChange(undefined, e)}
                            onKeyDown={(event) => handleEnterKeyPress(event, 'type_of_work')}
                            style={{
                              marginTop: '12px',
                              width: '100%',
                              border: 'none',
                              textAlign: 'center',
                              outline: 'none',
                              borderBottom: 'none',
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderBottomColor = 'white')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderBottomColor = '#ccc')
                            }
                          />
                        </div>
                        <div className='col-md-2 text-center'>
                          <b>Job Site No.</b>
                          <br />
                          <input
                            id='job_site_num'
                            type='text'
                            name='job_site_num'
                            value={formData.job_site_num}
                            autoComplete='off'
                            onChange={(e) => handleInputChange(undefined, e)}
                            onKeyDown={(event) => handleEnterKeyPress(event, 'job_site_num')}
                            style={{
                              marginTop: '12px',
                              width: '100%',
                              border: 'none',
                              textAlign: 'center',
                              outline: 'none',
                              borderBottom: 'none',
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderBottomColor = 'white')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderBottomColor = '#ccc')
                            }
                          />
                        </div>
                        <div className='col-md-2 text-center'>
                          <span
                            style={{
                              marginLeft: '50px',
                              fontWeight: 'bold',
                            }}
                          >
                            Job Name
                          </span>
                          <br />
                          <input
                            id='job_site_name'
                            type='text'
                            name='job_site_name'
                            autoComplete='off'
                            value={formData.job_site_name}
                            onChange={(e) => handleInputChange(undefined, e)}
                            onKeyDown={(event) => handleEnterKeyPress(event, 'job_site_name')}
                            style={{
                              marginTop: '12px',
                              width: '130%',
                              border: 'none',
                              textAlign: 'center',
                              outline: 'none',
                              borderBottom: 'none',
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderBottomColor = 'white')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderBottomColor = '#ccc')
                            }
                          />
                        </div>
                        <div className='col-md-3 text-center'>
                          <b>Job Location</b>
                          <br />
                          <input
                            id='job_location'
                            type='text'
                            name='job_location'
                            autoComplete='off'
                            value={formData.job_location}
                            onChange={(e) => handleInputChange(undefined, e)}
                            onKeyDown={(event) => handleEnterKeyPress(event, 'job_location')}
                            style={{
                              marginTop: '12px',
                              width: '100%',
                              border: 'none',
                              textAlign: 'center',
                              outline: 'none',
                              borderBottom: 'none',
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderBottomColor = 'white')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderBottomColor = '#ccc')
                            }
                          />
                        </div>
                      </div>

                      <div className='line'></div>
                      <div className="row item_details_div">
                        <span className="plus-icon" onClick={handleAddItem}>
                        </span>
                        &nbsp;
                        <div className="col-md-3" style={{ marginLeft: "-5px" }}>
                          <b>Lot No.</b>
                        </div>
                        <div className="col-md-5 text-center">
                          <b>Description</b>
                        </div>
                        <div className="col-md-1" style={{ marginLeft: "40px" }}><b>Quantity</b></div>
                        <div className="col-md-2" style={{ marginLeft: "16px" }}><b>Price Each</b></div>
                        <div className="col-md-1" style={{ marginLeft: "-80px" }}> <b>Amount</b></div>
                      </div>

                      {outerItem.items.map((item, innerIndex) => {
                        const actualIndex = index * CHUNK_SIZE + innerIndex;
                        return (
                          <div className='row' key={actualIndex}
                            style={{ marginTop: actualIndex === 0 ? '0px' : '0px' }}>

                            <div className='col-md-3'>
                              <TextField
                                id={`lot_no_${actualIndex}`}
                                key={actualIndex}
                                ref={(el) =>
                                  (inputRefs.current[actualIndex] = el)
                                }
                                variant='standard'
                                type='text'
                                name='lot_no'
                                value={item.lot_no}
                                autoComplete='off'
                                onKeyDown={(event) =>
                                  handleEnterKeyPress(
                                    event,
                                    'lot_no',
                                    actualIndex
                                  )
                                }
                                onChange={(e) =>
                                  handleInputChange(actualIndex, e)
                                }
                                style={{
                                  width: `150%`,
                                  // marginLeft: "6px",
                                  marginTop: "-9px"
                                }}
                                InputProps={{
                                  disableUnderline: true,
                                }}
                              />
                            </div>
                            <div className='col-md-5'>
                              <Autocomplete
                                id={`description_${actualIndex}`}
                                freeSolo
                                options={descriptions || []}
                                getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
                                ref={(el) => (inputRefs.current[actualIndex] = el)}
                                value={item.description || ''}
                                onChange={(event, newValue) => {
                                  const descriptionValue = newValue ? (typeof newValue === 'string' ? newValue : newValue.label) : '';
                                  handleInputChange(actualIndex, {
                                    target: {
                                      name: 'description',
                                      value: descriptionValue,
                                    },
                                  });
                                }}
                                onInputChange={(event, newInputValue, reason) => {
                                  if (reason === 'input') {
                                    handleInputChange(actualIndex, {
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
                                    variant='standard'
                                    style={{
                                      marginTop:
                                        actualIndex === 0 ? '-10px' : '-10px',
                                      width: '100%',
                                      marginLeft: "120px"
                                    }}
                                    onKeyDown={(event) =>
                                      handleEnterKeyPress(
                                        event,
                                        'description',
                                        actualIndex
                                      )
                                    }
                                  />
                                )}
                              />
                            </div>
                            <div className='col-md-1 text-center'>
                              <TextField
                                id={`quantity_${actualIndex}`}
                                variant='standard'
                                type='text'
                                name='quantity'
                                value={item.quantity}
                                autoComplete='off'
                                onChange={(e) =>
                                  handleInputChange(actualIndex, e)
                                }
                                InputProps={{
                                  disableUnderline: true,
                                  style: { textAlign: 'center' },
                                }}
                                style={{ width: "100%", marginLeft: "80px" }}
                                onKeyDown={(event) =>
                                  handleEnterKeyPress(
                                    event,
                                    'quantity',
                                    actualIndex
                                  )
                                }
                              />
                            </div>
                            <div
                              className='col-md-2'
                              style={{ position: 'relative' }}
                            >
                              <input
                                id={`price_each_${actualIndex}`}
                                type="text"
                                name="price_each"
                                value={item.price_each ? `$${item.price_each}` : ''}
                                onChange={(e) => handleInputChange(actualIndex, e)}
                                onBlur={(e) => handleInputBlur(actualIndex, e)}
                                style={{
                                  width: '65%',
                                  padding: "0px",
                                  textAlign: 'right',
                                  border: 'none',
                                  outline: 'none',
                                  marginLeft: "30px"
                                }}
                                autoComplete="off"
                                onKeyPress={(e) => {
                                  if (
                                    index == chunkedArray()?.length - 1 &&
                                    outerItem.items?.length - 1 == actualIndex
                                  )
                                    handleLotNoKeyPress(e, actualIndex);
                                }}
                                onKeyDown={(event) => {
                                  handleEnterKeyPress(
                                    event,
                                    'price_each',
                                    actualIndex,
                                    chunkedArray(),
                                    index,
                                    outerItem.items
                                  );
                                }}
                              />
                            </div>
                            <div
                              className='col-md-1'
                              style={{
                                marginLeft: '-65px',
                                width: '150px',
                                textAlign: 'right',
                              }}
                            >
                              <p style={{ height: '20px', margin: '0' }}>
                                {item.quantity && item.price_each
                                  ? `$${(
                                    (item.quantity || 0) *
                                    (parseFloat(item.price_each) || 0)
                                  ).toFixed(2)}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      {index === chunkedArray().length - 1 ? (
                        <div
                          className='invoice-last-div px-3'
                          style={{
                            marginTop:
                              formData.items.length === 2
                                ? '1000px'
                                : formData.items.length >= 3 && formData.items.length <= 5
                                  ? '600px'
                                  : formData.items.length >= 6 && formData.items.length <= 8
                                    ? '500px'
                                    : formData.items.length >= 9 &&
                                      formData.items.length <= 11
                                      ? '220px'
                                      : formData.items.length >= 12 &&
                                        formData.items.length <= 14
                                        ? '6px'
                                        : formData.items.length >= 15 &&
                                          formData.items.length <= 16
                                          ? '2px'
                                          : formData.items.length >= 17 &&
                                            formData.items.length <= 18
                                            ? '2px'
                                            : formData.items.length >= 19 &&
                                              formData.items.length <= 20
                                              ? '2px'
                                              : formData.items.length >= 21 &&
                                                formData.items.length <= 30
                                                ? '2px'
                                                : formData.items.length > 31
                                                  ? '0px'
                                                  : '0px',
                          }}
                        >
                          <p
                            style={{
                              marginRight: '70px',
                              marginTop: '35px',
                            }}
                          >
                            Total Due: {formData?.total_amount?.toLocaleString('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }) || '$0.00'}
                          </p>
                          <h5
                            style={{
                              fontSize: '25px',
                              fontWeight: '600',
                              marginTop: '-20px',
                            }}
                          >
                            Thank You! We truly appreciate your business!
                          </h5>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", }}>
                          <h5
                            style={{
                              fontSize: '25px',
                              fontWeight: '600',
                              marginTop: '50px',
                            }}
                          >
                            Thank You! We truly appreciate your business!
                          </h5>

                        </div>
                      )}
                    </div>{' '}

                  </>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default InvoiceForm;
