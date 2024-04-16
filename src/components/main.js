import React from "react";
import "../css/responsive.css";
import "../css/style.css";
import bgImg from "../assets/img/hero-bg.png";
import sliderImg from "../assets/img/invoice-img.png";
import { Link, useNavigate } from "react-router-dom";

export default function Main() {
  let navigate = useNavigate();

  const handleNavigate = () => {
    navigate("/", {
      replace: true
    })
  }


  return (
    <div>
      <div class="hero_area">
        <div class="hero_bg_box">
          <div class="bg_img_box">
            <img src={bgImg} alt="" />
          </div>
        </div>

        <header class="header_section">
          <div class="container-fluid">
            <nav class="navbar navbar-expand-lg custom_nav-container">
              <Link class="navbar-brand" to="/">
                <span> Tub Pro's </span>
              </Link>

              <div class="collapse navbar-collapse justify-content-end" id="navbarSupportedContent">
                <ul class="navbar-nav">
                  <li class="nav-item active">
                    <Link class="nav-link" to="/">
                      Home <span class="sr-only">(current)</span>
                    </Link>
                  </li>
                  <li class="nav-item dropdown">
                    <Link class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-expanded="false">
                      Actions
                    </Link>
                    <ul class="dropdown-menu mt-3" aria-labelledby="navbarDropdown"
                      style={{
                        width: "250px",
                        marginLeft: "-150px",

                      }}>
                      <li class="nav-item">
                        <Link class="nav-link" to="/estimate" style={{ color: "black" }}>
                          Generate Estimate
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/estimate_report" style={{ color: "black" }}>
                          Estimate Report
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/invoice" style={{ color: "black" }}>
                          Generate Invoice
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/job_site_report" style={{ color: "black" }}>
                          Job Site Report
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/unpaid_invoice_report" style={{ color: "black" }}>
                          Unpaid Invoices
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/income_report" style={{ color: "black" }}>
                          Income Report
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/sales_report" style={{ color: "black" }}>
                          Sales Trend
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/sales_statement" style={{ color: "black" }}>
                          Sales Statement
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/customer_report" style={{ color: "black" }}>
                          Customer Statement
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <Link class="nav-link" to="/employee_report" style={{ color: "black" }}>
                          Employee Report
                        </Link>
                      </li><hr />
                      <li class="nav-item">
                        <button
                          style={{
                            background: 'gray', border: 'none', color: 'white',
                            padding: '12px 20px', font: 'inherit', cursor: 'pointer',
                            margin: "auto", display: "flex", textAlign: "center",
                            justifyContent: "center", width: "90%"
                          }}
                          onClick={handleNavigate}>
                          Logout
                        </button>
                      </li>

                    </ul>
                  </li>
                </ul>
              </div>
            </nav>

          </div>
        </header>

        <section class="slider_section">
          <div id="customCarousel1" class="carousel slide" data-ride="carousel">
            <div class="carousel-inner">
              <div class="carousel-item active">
                <div
                  class="container"
                  style={{ backgroundColor: "transparent" }}
                >
                  <div class="row">
                    <div class="col-md-8 py-5">
                      <div class="detail-box">
                        <h1>
                          Tub <br />
                          Installation
                          <br />& Repair
                        </h1>
                        <p>
                          Tub Pro's invoice databse provides services like
                          generate invoice, <br />
                          recieve payment, report of unpaid invoices, report of
                          customers, <br />
                          income report and much more.
                        </p>
                        <div class="btn-box">
                          <Link to="/estimate" class="btn1">
                            Get Started
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="img-box">
                        <img src={sliderImg} alt="" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* <div class="carousel-item">
                <div
                  class="container"
                  style={{ backgroundColor: "transparent" }}
                >
                  <div class="row">
                    <div class="col">
                      <div class="img-box" style={{ marginLeft: "39%" }}>
                        <Lottie
                          animationData={require("../assets/animation/invoice.json")}
                          loop
                          autoplay
                          className="hero-animation"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
