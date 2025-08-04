import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from 'src/schemas/project.schema';
import { Model, Types } from 'mongoose';
import { ShareProjectDto } from './dto/shared-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) { }

  // Create a new project for a user
  // param data project info with owner ID
  async create(data: CreateProjectDto) {
    const project = new this.projectModel({
      ...data,
      owner: new Types.ObjectId(data.owner),
    });
    return project.save();
  }

  async findByIdWithAccess(
    projectId: string,
    user: { userId: string; role: string },
  ) {
    const project = await this.projectModel
      .findById(projectId)
      .populate('owner', 'name email')
      .populate('sharedWith.user')
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const isOwner = project.owner._id.toString() === user.userId;
    const isAdmin = user.role === 'admin';

    const isSharedUser = project.sharedWith.some(
      (entry) =>
        entry.user._id.toString() === user.userId &&
        (entry.permissions.includes('view') ||
          entry.permissions.includes('edit')),
    );

    if (!isOwner && !isAdmin && !isSharedUser) {
      throw new ForbiddenException(
        'Access denied: not owner, admin, or shared user',
      );
    }

    return project;
  }

  async updateProject(
    projectId: string,
    user: { userId: string; role: string },
    update: UpdateProjectDto,
  ) {
    const project = await this.projectModel
      .findById(projectId)
      .populate('sharedWith.user')
      .exec();

    if (!project) throw new NotFoundException('Project not found');

    const isOwner = project.owner.toString() === user.userId;
    const isAdmin = user.role === 'admin';
    const isSharedEditor = project.sharedWith.some(
      (entry) =>
        entry.user._id?.toString?.() === user.userId &&
        entry.permissions.includes('edit'),
    );

    if (!isOwner && !isAdmin && !isSharedEditor) {
      throw new ForbiddenException('Access denied');
    }

    return this.projectModel.findByIdAndUpdate(projectId, update, {
      new: true,
    });
  }

  // Find all projects owned by a user with optional search, pagination
  async findAll(ownerId: string, page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const userObjectId = new Types.ObjectId(ownerId);
    const query = {
      $or: [{ owner: userObjectId }, { 'sharedWith.user': userObjectId }],
      ...(search && { name: { $regex: search, $options: 'i' } }),
    };

    const [data, total] = await Promise.all([
      this.projectModel
        .find(query)
        .populate('owner')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.projectModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  // Share a project with another user by ID and assign permissions
  async shareProject(projectId: string, userId: string, permissions: string[]) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    project.sharedWith.push({ user: new Types.ObjectId(userId), permissions });
    return project.save();
  }

  async findAllProjectsForAdmin(page = 1, limit = 10, search = '') {
    const skip = (page - 1) * limit;
    const query = search ? { name: { $regex: search, $options: 'i' } } : {};

    const [data, total] = await Promise.all([
      this.projectModel
        .find(query)
        .populate('owner', 'name email')
        .populate('sharedWith.user', 'name email')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.projectModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async transferOwnership(projectId: string, newOwnerId: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    project.owner = new Types.ObjectId(newOwnerId);
    return project.save();
  }

  async shareProjectWithUser(
    projectId: string,
    { userId, permissions }: ShareProjectDto,
  ) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    const existing = project.sharedWith.find(
      (entry) => entry.user.toString() === userId,
    );

    if (existing) {
      existing.permissions = permissions;
    } else {
      project.sharedWith.push({
        user: new Types.ObjectId(userId),
        permissions: permissions,
      });
    }

    return project.save();
  }

  async findByTag(tag: string) {
    return this.projectModel
      .find({ tags: tag })
      .populate('owner', 'name email')
      .exec();
  }
}
