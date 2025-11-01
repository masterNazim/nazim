-- Create contact_messages table for admin messages functionality
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  priority VARCHAR(20) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replied_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Contact messages are viewable by authenticated users" 
ON contact_messages FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Contact messages are manageable by authenticated users" 
ON contact_messages FOR ALL 
USING (auth.role() = 'authenticated');

-- Allow anonymous users to insert contact messages (for contact form)
CREATE POLICY "Anyone can submit contact messages" 
ON contact_messages FOR INSERT 
WITH CHECK (true);

-- Insert some sample data for testing
INSERT INTO contact_messages (name, email, phone, subject, message, status, priority)
SELECT 
  'John Doe',
  'john@example.com',
  '+1234567890',
  'Product Inquiry',
  'I am interested in your dining table collection. Could you provide more details about the materials used?',
  'unread',
  'normal'
WHERE NOT EXISTS (SELECT 1 FROM contact_messages WHERE email = 'john@example.com');

INSERT INTO contact_messages (name, email, phone, subject, message, status, priority)
SELECT 
  'Sarah Smith',
  'sarah@example.com',
  '+1987654321',
  'Order Status',
  'I placed an order last week and would like to check on the delivery status.',
  'unread',
  'high'
WHERE NOT EXISTS (SELECT 1 FROM contact_messages WHERE email = 'sarah@example.com');
