import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// Enable CORS
app.use('*', cors());

// In-memory storage for orders (in production, use a database)
let orders: any[] = [];

// Create new order
app.post('/', async (c) => {
  try {
    const orderData = await c.req.json();
    
    // Validate required fields
    if (!orderData.orderId || !orderData.products || !orderData.totalAmount || !orderData.deliveryInfo) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    // Add timestamp and status
    const order = {
      ...orderData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: orderData.status || 'pending'
    };
    
    // Save order
    orders.push(order);
    
    return c.json({ 
      success: true, 
      orderId: order.orderId,
      message: 'Order created successfully' 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return c.json({ error: 'Failed to create order' }, 500);
  }
});

// Get all orders (for admin)
app.get('/', async (c) => {
  try {
    const { status, limit = '50', offset = '0' } = c.req.query();
    
    let filteredOrders = orders;
    
    // Filter by status if provided
    if (status) {
      filteredOrders = orders.filter(order => order.status === status);
    }
    
    // Sort by creation date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedOrders = filteredOrders.slice(offsetNum, offsetNum + limitNum);
    
    return c.json({
      orders: paginatedOrders,
      total: filteredOrders.length,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Get single order by ID
app.get('/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const order = orders.find(o => o.orderId === orderId);
    
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    return c.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// Update order status
app.patch('/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const updateData = await c.req.json();
    
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    
    if (orderIndex === -1) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    // Update order
    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    return c.json({ 
      success: true, 
      order: orders[orderIndex],
      message: 'Order updated successfully' 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// Delete order
app.delete('/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    
    if (orderIndex === -1) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    // Remove order
    orders.splice(orderIndex, 1);
    
    return c.json({ 
      success: true, 
      message: 'Order deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return c.json({ error: 'Failed to delete order' }, 500);
  }
});

// GET /api/orders/stats - Get order statistics
app.get('/stats', (c) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(order => 
    new Date(order.createdAt) >= today
  );
  
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    todayOrders: todayOrders.length,
    todayRevenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0)
  };
  
  return c.json(stats);
});

// GET /api/orders/:id - Get specific order
app.get('/:id', (c) => {
  const orderId = c.req.param('id');
  const order = orders.find(o => o.orderId === orderId);
  
  if (!order) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  return c.json(order);
});

// PATCH /api/orders/:id - Update order
app.patch('/:id', async (c) => {
  const orderId = c.req.param('id');
  const updates = await c.req.json();
  
  const orderIndex = orders.findIndex(o => o.orderId === orderId);
  if (orderIndex === -1) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  // Update the order
  orders[orderIndex] = { ...orders[orderIndex], ...updates };
  
  return c.json(orders[orderIndex]);
});

// DELETE /api/orders/:id - Delete order
app.delete('/:id', (c) => {
  const orderId = c.req.param('id');
  const orderIndex = orders.findIndex(o => o.orderId === orderId);
  
  if (orderIndex === -1) {
    return c.json({ error: 'Order not found' }, 404);
  }
  
  const deletedOrder = orders.splice(orderIndex, 1)[0];
  return c.json({ message: 'Order deleted successfully', order: deletedOrder });
});

export default app;