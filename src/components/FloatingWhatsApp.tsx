import { barberSettings } from '@/data/barber';

export function FloatingWhatsApp() {
  return (
    <a
      href={`https://wa.me/${barberSettings.whatsappNumber}?text=${encodeURIComponent(barberSettings.whatsappMessage)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-4 right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition-colors duration-200 hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0f] md:h-12 md:w-12"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        className="block h-6 w-6 shrink-0"
      >
        <path
          fill="currentColor"
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.768.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.173.198-.297.298-.495.099-.198.05-.372-.025-.521-.074-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.009-.372-.011-.57-.011-.198 0-.521.074-.793.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.511-5.26c.002-5.45 4.438-9.884 9.89-9.884 2.64.001 5.12 1.03 6.985 2.897a9.82 9.82 0 0 1 2.889 6.994c-.002 5.45-4.438 9.885-9.88 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.334.158 11.89c0 2.096.547 4.142 1.588 5.946L.053 24l6.304-1.654a11.87 11.87 0 0 0 5.684 1.448h.005c6.554 0 11.89-5.335 11.893-11.89a11.82 11.82 0 0 0-3.475-8.416z"
        />
      </svg>
    </a>
  );
}
