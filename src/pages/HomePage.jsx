import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Section, { Card } from "../components/Section";
import Footer from "../components/Footer";
import "./HomePage.css";

export default function HomePage() {
  return (
    <div className="home-page">
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* About Section */}
      <Section
        id="about"
        title="About Our School"
        subtitle="Building Foundations for Success"
        bgColor="light"
        layout="grid"
      >
        <Card
          icon="🎓"
          title="Quality Education"
          description="We provide world-class education with modern teaching methods and experienced educators."
          color="blue"
        />
        <Card
          icon="🏆"
          title="Excellence"
          description="Our commitment to excellence ensures students achieve their highest potential."
          color="teal"
        />
        <Card
          icon="🌍"
          title="Global Perspective"
          description="We prepare students to excel in a globally connected and competitive world."
          color="purple"
        />
        <Card
          icon="💡"
          title="Innovation"
          description="Cutting-edge technology and innovative teaching methods transform learning experiences."
          color="orange"
        />
      </Section>

      {/* Values Section */}
      <Section
        id="values"
        title="Our Core Values"
        subtitle="Principles that guide our educational mission"
        bgColor="white"
        layout="grid"
      >
        <Card
          icon="❤️"
          title="Integrity"
          description="We uphold the highest standards of honesty, ethics, and accountability in all our endeavors."
          color="blue"
        />
        <Card
          icon="🤝"
          title="Inclusivity"
          description="Every student is valued and supported in their unique journey of growth and development."
          color="teal"
        />
        <Card
          icon="🚀"
          title="Growth"
          description="We foster continuous learning and personal development for students and staff alike."
          color="purple"
        />
        <Card
          icon="🌟"
          title="Empowerment"
          description="We empower students to become confident leaders and responsible global citizens."
          color="orange"
        />
      </Section>

      {/* Achievements Section */}
      <Section
        id="achievements"
        title="Our Achievements"
        subtitle="Milestones that showcase our commitment to excellence"
        bgColor="light"
        layout="grid"
      >
        <div className="milestone">
          <div className="milestone-number">98%</div>
          <p className="milestone-text">Student Pass Rate</p>
        </div>
        <div className="milestone">
          <div className="milestone-number">150+</div>
          <p className="milestone-text">Awards & Recognition</p>
        </div>
        <div className="milestone">
          <div className="milestone-number">5000+</div>
          <p className="milestone-text">Successful Alumni</p>
        </div>
        <div className="milestone">
          <div className="milestone-number">100+</div>
          <p className="milestone-text">Expert Educators</p>
        </div>
      </Section>

      {/* Why Choose Us Section */}
      <Section
        id="why-us"
        title="Why Choose EduVision Academy?"
        subtitle="Excellence in every aspect of education"
        bgColor="white"
        layout="grid"
      >
        <Card
          icon="📚"
          title="Comprehensive Curriculum"
          description="Our well-rounded curriculum covers academics, arts, sports, and skill development."
          color="blue"
        />
        <Card
          icon="👨‍🏫"
          title="Expert Faculty"
          description="Highly qualified and experienced educators dedicated to student success."
          color="teal"
        />
        <Card
          icon="🔬"
          title="Modern Facilities"
          description="State-of-the-art laboratories, libraries, and learning spaces."
          color="purple"
        />
        <Card
          icon="🎯"
          title="Personalized Attention"
          description="Small class sizes ensure individual attention and customized learning paths."
          color="orange"
        />
        <Card
          icon="🏅"
          title="Co-curricular Activities"
          description="Rich programs in sports, arts, debating, and community service."
          color="blue"
        />
        <Card
          icon="🌱"
          title="Holistic Development"
          description="We nurture academic, emotional, social, and physical growth."
          color="teal"
        />
      </Section>

      {/* Admissions Section */}
      <Section
        id="admissions"
        title="Admissions Open"
        subtitle="Join our community of learners"
        bgColor="light"
      >
        <div className="admissions-content">
          <div className="admissions-text">
            <h3>Start Your Journey with Us</h3>
            <ul className="admissions-list">
              <li>✓ Open admissions for all classes</li>
              <li>✓ Online and offline admission process</li>
              <li>✓ Scholarship programs available</li>
              <li>✓ Flexible payment options</li>
              <li>✓ Free campus tour on weekends</li>
              <li>✓ Entrance assessment for higher classes</li>
            </ul>
            <button className="admissions-button">Apply Now</button>
          </div>
        </div>
      </Section>

      {/* Contact Section */}
      <Section
        id="contact"
        title="Get In Touch"
        subtitle="We'd love to hear from you"
        bgColor="white"
      >
        <div className="contact-wrapper">
          <div className="contact-card">
            <div className="contact-icon">📍</div>
            <h4>Address</h4>
            <p>123 Education Road<br />Tech City, TC 12345</p>
          </div>
          <div className="contact-card">
            <div className="contact-icon">📞</div>
            <h4>Phone</h4>
            <p>+1 (234) 567-890<br />+1 (234) 567-891</p>
          </div>
          <div className="contact-card">
            <div className="contact-icon">✉️</div>
            <h4>Email</h4>
            <p>info@eduvision.edu<br />admissions@eduvision.edu</p>
          </div>
          <div className="contact-card">
            <div className="contact-icon">⏰</div>
            <h4>Hours</h4>
            <p>Mon - Fri: 8:00 AM - 4:00 PM<br />Sat: 9:00 AM - 1:00 PM</p>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
