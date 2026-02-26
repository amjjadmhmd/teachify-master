import React, { forwardRef } from 'react';
import { ASSETS } from '../constants/assets';

interface CertificateDesign {
  colorScheme: 'blue' | 'green' | 'purple' | 'gold';
  fontSize: 'small' | 'medium' | 'large';
  borderStyle: 'double' | 'solid' | 'dashed';
  showLogo: boolean;
  showWatermark: boolean;
}

interface CertificateProps {
  recipientName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  instructorName: string;
  design?: CertificateDesign;
}

const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  ({ recipientName, courseName, completionDate, certificateId, instructorName, design }, ref) => {
    // Default design
    const finalDesign: CertificateDesign = design || {
      colorScheme: 'blue',
      fontSize: 'medium',
      borderStyle: 'double',
      showLogo: true,
      showWatermark: true,
    };

    // Color schemes
    const colorMap = {
      blue: '#0066CC',
      green: '#16A34A',
      purple: '#9333EA',
      gold: '#D97706',
    };

    const colorHex = colorMap[finalDesign.colorScheme];

    // Font size mapping
    const fontSizes = {
      small: { title: 40, subtitle: 24, name: 32, body: 14, course: 18 },
      medium: { title: 56, subtitle: 28, name: 44, body: 16, course: 22 },
      large: { title: 72, subtitle: 32, name: 56, body: 18, course: 26 },
    };

    const sizes = fontSizes[finalDesign.fontSize];

    return (
      <div
        ref={ref}
        className="certificate-border w-full max-w-5xl bg-white relative shadow-2xl"
        style={{ minHeight: '600px', fontFamily: 'Arial, sans-serif' }}
      >
        {/* Main container with padding */}
        <div style={{ padding: '3rem', position: 'relative', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

          {/* Decorative Border */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              right: '1rem',
              bottom: '1rem',
              border: `8px ${finalDesign.borderStyle === 'double' ? 'double' : finalDesign.borderStyle === 'solid' ? 'solid' : 'dashed'} ${colorHex}`,
              borderRadius: '8px',
              pointerEvents: 'none',
            }}
          ></div>

          {/* Corner Decorations - Top Left */}
          <div
            style={{
              position: 'absolute',
              top: '2rem',
              left: '2rem',
              width: '60px',
              height: '60px',
              borderTop: `4px solid ${colorHex}`,
              borderLeft: `4px solid ${colorHex}`,
            }}
          ></div>

          {/* Corner Decorations - Top Right */}
          <div
            style={{
              position: 'absolute',
              top: '2rem',
              right: '2rem',
              width: '60px',
              height: '60px',
              borderTop: `4px solid ${colorHex}`,
              borderRight: `4px solid ${colorHex}`,
            }}
          ></div>

          {/* Corner Decorations - Bottom Left */}
          <div
            style={{
              position: 'absolute',
              bottom: '2rem',
              left: '2rem',
              width: '60px',
              height: '60px',
              borderBottom: `4px solid ${colorHex}`,
              borderLeft: `4px solid ${colorHex}`,
            }}
          ></div>

          {/* Corner Decorations - Bottom Right */}
          <div
            style={{
              position: 'absolute',
              bottom: '2rem',
              right: '2rem',
              width: '60px',
              height: '60px',
              borderBottom: `4px solid ${colorHex}`,
              borderRight: `4px solid ${colorHex}`,
            }}
          ></div>

          {/* Content - z-10 to appear above decorations */}
          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>

            {/* Logo */}
            {finalDesign.showLogo && (
              <div style={{ marginBottom: '0.5rem' }}>
                <img
                  src={ASSETS.LOGO}
                  alt="Geo Top Logo"
                  style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                />
              </div>
            )}

            {/* Platform Name */}
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151', letterSpacing: '0.1em', margin: 0 }}>
              Geo Top EDUCATIONAL PLATFORM
            </h3>

            {/* Certificate Title */}
            <div style={{ margin: '1rem 0' }}>
              <h1 style={{ fontSize: `${sizes.title}px`, fontFamily: 'Georgia, serif', fontWeight: 'bold', color: '#1F2937', margin: '0.5rem 0', lineHeight: 1.2 }}>
                Certificate
              </h1>
              <h2 style={{ fontSize: `${sizes.subtitle}px`, fontFamily: 'Georgia, serif', color: '#4B5563', fontStyle: 'italic', margin: '0.5rem 0', lineHeight: 1.2 }}>
                of Completion
              </h2>
            </div>

            {/* Divider */}
            <div style={{ width: '100px', height: '4px', backgroundColor: colorHex, margin: '1rem 0' }}></div>

            {/* Body Text */}
            <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <p style={{ fontSize: `${sizes.body}px`, color: '#4B5563', margin: 0 }}>
                This is to certify that
              </p>

              <div>
                <p style={{
                  fontSize: `${sizes.name}px`,
                  fontFamily: 'Georgia, serif',
                  fontWeight: 'bold',
                  color: '#111827',
                  padding: '0.5rem 2rem',
                  borderBottom: '2px solid #9CA3AF',
                  display: 'inline-block',
                  margin: 0,
                }}>
                  {recipientName}
                </p>
              </div>

              <p style={{ fontSize: `${sizes.body}px`, color: '#4B5563', margin: 0, paddingTop: '0.5rem' }}>
                has successfully completed the course
              </p>

              <p style={{ fontSize: `${sizes.course}px`, fontWeight: '600', color: colorHex, padding: '0.5rem 0', margin: 0 }}>
                {courseName}
              </p>

              <p style={{ fontSize: `${sizes.body}px`, color: '#4B5563', margin: 0 }}>
                Completed on <span style={{ fontWeight: '600', color: '#1F2937' }}>{completionDate}</span>
              </p>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', width: '100%', maxWidth: '700px', marginTop: '2rem', paddingTop: '2rem' }}>

              {/* Instructor Signature */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ borderTop: '2px solid #9CA3AF', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: `${sizes.body}px`, fontWeight: 'bold', color: '#1F2937', margin: '0.5rem 0 0 0', whiteSpace: 'nowrap' }}>
                    {instructorName}
                  </p>
                  <p style={{ fontSize: '12px', color: '#4B5563', margin: '0.25rem 0 0 0' }}>
                    Course Instructor
                  </p>
                </div>
              </div>

              {/* Center Logo */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 1rem' }}>
                <img
                  src={ASSETS.LOGO}
                  alt="Geo Top Seal"
                  style={{ width: '60px', height: '60px', objectFit: 'contain', margin: '0 0 0.5rem 0' }}
                />
              </div>

              {/* Platform Signature */}
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ borderTop: '2px solid #9CA3AF', paddingTop: '0.75rem' }}>
                  <p style={{ fontSize: `${sizes.body}px`, fontWeight: 'bold', color: '#1F2937', margin: '0.5rem 0 0 0', whiteSpace: 'nowrap' }}>
                    Geo Top Platform
                  </p>
                  <p style={{ fontSize: '12px', color: '#4B5563', margin: '0.25rem 0 0 0' }}>
                    Official Certification
                  </p>
                </div>
              </div>
            </div>

            {/* Certificate ID */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
              <p style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: 'monospace', margin: 0 }}>
                Certificate ID: {certificateId}
              </p>
            </div>

          </div>
        </div>

        {/* Watermark */}
        {finalDesign.showWatermark && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.05,
            pointerEvents: 'none',
          }}>
            <img
              src={ASSETS.LOGO}
              alt="Watermark"
              style={{ width: '288px', height: '288px', objectFit: 'contain' }}
            />
          </div>
        )}
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';

export default Certificate;

