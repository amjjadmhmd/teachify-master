import React, { useState, useEffect } from 'react';
import { Lang, Theme } from '../../types';
import { api } from '../../api/client';
import { Card, Button } from '../../components/UI';
import { Reveal } from '../../components/Reveal';
import { Award, Download, Eye, ExternalLink, Calendar, Code } from 'lucide-react';

interface Certificate {
  id: number;
  student: number;
  exam?: number;
  exam_title?: string;
  certificate_code: string;
  verification_code: string;
  image?: string;
  issued_at: string;
  student_name?: string;
}

interface Props {
  lang: Lang;
  theme: Theme;
}

const StudentCertificates: React.FC<Props> = ({ lang, theme }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showModal, setShowModal] = useState(false);

  const isEn = lang === 'en';

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      console.log('API object:', api);
      console.log('Exams service:', api.exams);
      console.log('Fetching certificates...');
      
      // Try getCertificates first, then fall back to listCertificates
      const data = api.exams?.getCertificates 
        ? await api.exams.getCertificates()
        : await api.exams?.listCertificates?.();
        
      console.log('Certificates data received:', data);
      console.log('Certificates type:', typeof data);
      console.log('Certificates is array:', Array.isArray(data));
      setCertificates(data || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (cert: Certificate) => {
    if (cert.image) {
      const link = document.createElement('a');
      link.href = cert.image;
      link.download = `Certificate_${cert.certificate_code}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewCertificate = (cert: Certificate) => {
    setSelectedCert(cert);
    setShowModal(true);
  };

  const closeCertificateModal = () => {
    setShowModal(false);
    setSelectedCert(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(isEn ? 'en-US' : 'ar-EG');
  };

  if (loading) {
    return (
      <div className="pt-32 sm:pt-40 pb-10 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Award className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
            <p className="text-gray-600">{isEn ? 'Loading certificates...' : 'جاري تحميل الشهادات...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <Reveal>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl sm:text-4xl font-bold">
              {isEn ? 'My Certificates' : 'شهاداتي'}
            </h1>
          </div>
          <p className="text-gray-600">
            {isEn
              ? 'View and download your earned certificates'
              : 'اعرض وحمّل شهاداتك المكتسبة'}
          </p>
        </div>
      </Reveal>

      {certificates.length === 0 ? (
        <Reveal>
          <Card className={`p-8 text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">
              {isEn ? 'No certificates yet' : 'لا توجد شهادات حتى الآن'}
            </h2>
            <p className="text-gray-600">
              {isEn
                ? 'Complete courses to earn certificates'
                : 'أكمل الدورات لكسب الشهادات'}
            </p>
          </Card>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert, idx) => (
            <Reveal key={cert.id} delay={idx * 0.1}>
              <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                {/* Certificate Preview */}
                {cert.image && (
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    <img
                      src={cert.image}
                      alt="Certificate"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Certificate Info */}
                <div className="p-4 flex flex-col h-full">
                  <h3 className="text-lg font-semibold mb-3 line-clamp-2">{cert.exam_title}</h3>

                  <div className="space-y-2 mb-4 text-xs text-gray-600 flex-grow">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{formatDate(cert.issued_at)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Code className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="font-mono text-xs truncate" title={cert.certificate_code}>
                        {cert.certificate_code}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleViewCertificate(cert)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      {isEn ? 'View' : 'عرض'}
                    </Button>
                    {cert.image && (
                      <Button
                        onClick={() => handleDownload(cert)}
                        variant="primary"
                        size="sm"
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {isEn ? 'Download' : 'تحميل'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}

      {/* Certificate Modal */}
      {showModal && selectedCert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className={`max-w-2xl w-full max-h-96 overflow-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedCert.exam_title}</h2>
                <button
                  onClick={closeCertificateModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedCert.image && (
                <div className="mb-4 rounded overflow-hidden">
                  <img
                    src={selectedCert.image}
                    alt="Certificate"
                    className="w-full h-auto"
                  />
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Code className="w-4 h-4" />
                  <span className="font-mono">{selectedCert.certificate_code}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedCert.issued_at)}</span>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-1">{isEn ? 'Verification Code' : 'رمز التحقق'}</p>
                  <p className="font-mono text-xs break-all bg-gray-100 dark:bg-gray-700 p-2 rounded">
                    {selectedCert.verification_code}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedCert.image && (
                  <Button
                    onClick={() => handleDownload(selectedCert)}
                    variant="primary"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isEn ? 'Download Certificate' : 'تحميل الشهادة'}
                  </Button>
                )}
                <Button
                  onClick={closeCertificateModal}
                  variant="secondary"
                  className="flex-1"
                >
                  {isEn ? 'Close' : 'إغلاق'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentCertificates;