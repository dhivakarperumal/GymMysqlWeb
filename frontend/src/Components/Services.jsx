import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import AOS from "aos";
import "aos/dist/aos.css";
import ServiceCard from "./ServicesCard";

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await api.get("/services");
        setServices(response.data);
        setTimeout(() => {
          AOS.refresh();
        }, 100);
      } catch (err) {
        console.error("Failed to fetch services:", err);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Services"
        subtitle="Personalized fitness services designed for every goal and body type"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="bg-[#05060c] py-20">
        <PageContainer>
          <div data-aos="fade-up" className="">
            {/* Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {services.map((item, index) => (
                <ServiceCard key={item.id} item={item} index={index} />
              ))}
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  );
}
