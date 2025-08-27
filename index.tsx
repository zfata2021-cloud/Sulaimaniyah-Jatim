import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';

const App = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({ name: '', attending: 'yes' });
  const [loading,setLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [error, setError] = useState('');
  const [recipient, setRecipient] = useState({
    name: 'Prof. Dr. H. Abd. Halim Soebahar, M.A.',
    title: '(Ketua LPPD Provinsi Jawa Timur)',
  });


  const detailsRef = useRef<HTMLDivElement>(null);
  const agendaRef = useRef<HTMLDivElement>(null);
  const rsvpRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Effect for parsing URL params - runs only once
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('name');
    const title = urlParams.get('title');

    if (name || title) {
        setRecipient(prev => ({
            name: name || prev.name,
            title: title || prev.title,
        }));
    }
  }, []);

  useEffect(() => {
    // Observer to fade in sections as they are scrolled into view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Optional: stop observing after it's visible
          }
        });
      },
      { threshold: 0.4 } // Trigger when 40% of the element is visible
    );

    const refs = [coverRef, detailsRef, agendaRef, rsvpRef];
    refs.forEach(ref => {
        if (ref.current) {
            observer.observe(ref.current);
        }
    });

    return () => observer.disconnect();
  }, [showConfirmation]); // Re-run if the user starts over

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleOpenInvitation = () => {
    scrollTo(detailsRef);
    audioRef.current?.play().catch(e => console.error("Audio playback failed:", e));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Mohon masukkan nama Anda.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const prompt = `Generate a short, warm, and polite thank-you message in Indonesian for an event RSVP. The guest's name is ${formData.name}. They have RSVP'd '${formData.attending === 'yes' ? 'Hadir' : 'Berhalangan'}'. Keep it under 50 words. Example: "Terima kasih Bapak/Ibu ${formData.name}, konfirmasi Anda telah kami terima. Kami menantikan kehadiran Anda."`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setConfirmationMessage(response.text);
      setShowConfirmation(true);
    } catch (err)
 {
      console.error('API Error:', err);
      // Fallback message in case of API error
      setConfirmationMessage(`Terima kasih, ${formData.name}! Konfirmasi Anda telah kami terima. Kami menantikan kehadiran Anda.`);
      setShowConfirmation(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setShowConfirmation(false);
    setFormData({ name: '', attending: 'yes' });
    // This allows the animations to re-trigger
    setTimeout(() => {
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('visible'));
    }, 0);
  }
  
  return (
    <div className="app-container">
      {showConfirmation ? (
        <ConfirmationPage
          message={confirmationMessage}
          onStartOver={handleStartOver}
          attending={formData.attending === 'yes'}
        />
      ) : (
        <>
          <div ref={coverRef} className="page" aria-labelledby="cover-title">
            <CoverPage onNext={handleOpenInvitation} name={recipient.name} title={recipient.title} />
          </div>
          <div ref={detailsRef} className="page" aria-labelledby="details-title">
            <DetailsPage onNext={() => scrollTo(agendaRef)} name={recipient.name} />
          </div>
          <div ref={agendaRef} className="page" aria-labelledby="agenda-title">
            <AgendaPage onNext={() => scrollTo(rsvpRef)} />
          </div>
          <div ref={rsvpRef} className="page" aria-labelledby="rsvp-title">
            <RsvpPage 
              formData={formData} 
              loading={loading}
              error={error}
              onInputChange={handleInputChange} 
              onSubmit={handleRsvpSubmit} 
            />
          </div>
        </>
      )}
      <audio
        ref={audioRef}
        src="salavat-i-serife-128-ytshorts.savetube.me.mp3"
        loop
        preload="auto"
      />
    </div>
  );
};

const Logo = () => (
  <img
    src="https://i.imghippo.com/files/LjU3104ZQU.png"
    alt="Logo Sulaimaniyah"
    className="app-logo"
  />
);

const CoverPage = ({ onNext, name, title }: { onNext: () => void; name: string; title: string }) => (
    <>
      <Logo />
      <div className="corner top-left"></div>
      <div className="corner top-right"></div>
      <p className="subtitle">YAYASAN TAHFIDZ</p>
      <h2 id="cover-title">SULAIMANIYAH JAWA TIMUR</h2>
      <p className="tagline">Menuju Generasi Berilmu dan Bertakwa</p>
      <h1 className="invitation-title">Undangan</h1>
      <p className="event-title">
        PERESMIAN PONDOK PESANTREN SULAIMANIYAH
        <br />
        AN NADWAH BANYUGLUGUR SITUBONDO
      </p>
      <p className="date">Ahad, 14 September 2025</p>
      <div className="recipient-box">
        <div className="corner top-left"></div>
        <div className="corner top-right"></div>
        <strong>{name}</strong>
        <p>{title}</p>
        <p>Di Tempat</p>
        <div className="corner bottom-left"></div>
        <div className="corner bottom-right"></div>
      </div>
      <button className="btn" onClick={onNext} aria-label="Buka Undangan">
        Buka Undangan
      </button>
    </>
  );

const DetailsPage = ({ onNext, name }: { onNext: () => void; name: string }) => (
  <>
    <Logo />
    <div className="corner top-left"></div>
    <div className="corner top-right"></div>
    <p>Dengan Hormat Mengharapkan Kehadiran Bpk/Ibu Saudara/Saudari:</p>
    <p><strong>{name}</strong></p>
    <p>Sebagai Tamu Kami Pada;</p>
    <h2 id="details-title">
      PERESMIAN PONDOK PESANTREN SULAIMANIYAH
      <br />
      AN NADWAH BANYUGLUGUR SITUBONDO
    </h2>
    <p>Dilaksanakan pada:</p>
    <p>
      <strong>Ahad, 14 September 2025</strong><br/>
      Pukul 08.00 WIB s.d. Selesai
    </p>
    <p>
      Jl, Rampak, Lubawang, Kec. Banyuglugur, Kabupaten Situbondo,
      <br/>
      Jawa Timur 68359
    </p>
    <p>
      Demikian Undangan Ini Kami Sampaikan.
      <br />
      Atas Kesediaan dan Kehadiran Bpk/Ibu Saudara. Kami Ucapkan Terimakasih.
    </p>
    <div className="page-actions">
        <a
            href="https://maps.app.goo.gl/WhJBipDf1tVzapiCA"
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            aria-label="Buka lokasi di Google Maps"
        >
            Lihat Peta Lokasi
        </a>
        <button className="btn" onClick={onNext} aria-label="Lihat Susunan Acara">Lihat Susunan Acara</button>
    </div>
    <div className="corner bottom-left"></div>
    <div className="corner bottom-right"></div>
  </>
);

const AgendaPage = ({ onNext }: { onNext: () => void }) => (
  <>
    <Logo />
    <div className="corner top-left"></div>
    <div className="corner top-right"></div>
    <h2 id="agenda-title">Susunan Acara</h2>
    <ol className="agenda-list">
      <li>Pembukaan</li>
      <li>Menyanyikan Lagu "Indonesia Raya"</li>
      <li>Pembacaan Ayat Suci Al-Qur'an</li>
      <li>Sambutan-Sambutan</li>
      <li>Sholawat-Sholawat</li>
      <li>Ceramah</li>
      <li>Penutup</li>
      <li>Upacara Pembukaan Gedung</li>
      <li>Ramah Tamah</li>
    </ol>
    <button className="btn" onClick={onNext} aria-label="Lanjut ke halaman konfirmasi kehadiran">
      Konfirmasi Kehadiran
    </button>
    <div className="corner bottom-left"></div>
    <div className="corner bottom-right"></div>
  </>
);


const RsvpPage = ({ formData, loading, error, onInputChange, onSubmit }: { 
  formData: { name: string; attending: string };
  loading: boolean;
  error: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <>
    <Logo />
    <div className="corner top-left"></div>
    <div className="corner top-right"></div>
    <h2 id="rsvp-title">Konfirmasi Kehadiran</h2>
    <p className="sub-heading">Mohon konfirmasi kehadiran Anda.</p>
    <form className="rsvp-form" onSubmit={onSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="name">Nama Lengkap</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          required
          aria-required="true"
          aria-describedby={error ? "error-message" : undefined}
        />
        {error && <p id="error-message" style={{ color: '#c0392b', fontSize: '0.9rem', marginTop: '0.5rem' }}>{error}</p>}
      </div>
      <div className="form-group">
        <label>Apakah Anda akan hadir?</label>
        <div className="attendance-options" role="radiogroup">
          <input type="radio" id="yes" name="attending" value="yes" checked={formData.attending === 'yes'} onChange={onInputChange} />
          <label htmlFor="yes">Insya Allah Hadir</label>
          <input type="radio" id="no" name="attending" value="no" checked={formData.attending === 'no'} onChange={onInputChange} />
          <label htmlFor="no">Berhalangan</label>
        </div>
      </div>
      {loading ? <div className="loader" role="status" aria-label="Loading"></div> : <button type="submit" className="btn">Kirim Konfirmasi</button>}
    </form>
    <div className="corner bottom-left"></div>
    <div className="corner bottom-right"></div>
  </>
);

const ConfirmationPage = ({ message, onStartOver, attending }: { message: string; onStartOver: () => void; attending: boolean }) => (
  <div className="page visible" aria-labelledby="confirmation-title">
    <Logo />
    <h2 id="confirmation-title">Terima Kasih!</h2>
    <div className="confirmation-message" role="alert">
        <p>{message}</p>
    </div>
    <div className="confirmation-actions">
      {attending && (
        <a
          href="https://maps.app.goo.gl/WhJBipDf1tVzapiCA"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          aria-label="Buka lokasi di Google Maps"
        >
          Buka Peta Lokasi
        </a>
      )}
      <button className="btn" onClick={onStartOver} aria-label="Kembali ke awal">
        Kembali
      </button>
    </div>
  </div>
);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);