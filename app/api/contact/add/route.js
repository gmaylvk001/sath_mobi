import dbConnect from "@/lib/db";
import Contact from "@/models/ecom_contact_info";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, subject, mobile_number, message } = body ?? {};
    const updatesConsent = body?.updatesConsent === true;

    if (
      ![name, subject, mobile_number, message].every(
        (value) => typeof value === "string" && value.trim()
      )
    ) {
      return Response.json({ message: "All fields are required" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(mobile_number.trim())) {
      return Response.json(
        { message: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    const newContact = new Contact({
      name: name.trim(),
      subject: subject.trim(),
      mobile_number: mobile_number.trim(),
      message: message.trim(),
      updatesConsent,
      status: "active",
    });

    await newContact.save();

    return Response.json({ message: "Message sent successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error saving contact:", error);
    if (error?.name === "ValidationError") {
      return Response.json(
        { message: Object.values(error.errors).map(({ message }) => message).join(", ") },
        { status: 400 }
      );
    }
    return Response.json({ message: "Server error" }, { status: 500 });
  }
}
