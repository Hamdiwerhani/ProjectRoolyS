import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectDocument } from 'src/schemas/project.schema';
import { Model, Types } from 'mongoose';
import { ShareProjectDto } from './dto/shared-project.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TransferOwnerDto } from './dto/transferowner.dto';
import { ProjectPaginationResult } from 'src/types/project-pagination-result.interface';
import { updateShareProjectDto } from './dto/update-share.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) { }

  // Create a new project for a user
  // param data project info with owner ID
  async create(data: CreateProjectDto & { owner: string }): Promise<Project> {
    try {
      const project = new this.projectModel({
        ...data,
        owner: new Types.ObjectId(data.owner),
      });
      return await project.save();
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create project: ${error instanceof Error ? error.message : ''}`,
      );
    }
  }

  async findByIdWithAccess(
    projectId: string,
    user: { userId: string; role: string },
  ): Promise<Project> {
    try {
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
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch project');
    }
  }

  async updateProject(
    projectId: string,
    user: { sub: string; role: string },
    update: UpdateProjectDto,
  ): Promise<Project> {
    try {
      const project = await this.projectModel
        .findById(projectId)
        .populate('sharedWith.user')
        .exec();

      if (!project) throw new NotFoundException('Project not found');

      const isOwner = project.owner.toString() === user.sub;
      const isAdmin = user.role === 'admin';
      const isSharedEditor = project.sharedWith.some(
        (entry) =>
          entry.user._id?.toString?.() === user.sub &&
          entry.permissions.includes('edit'),
      );

      if (!isOwner && !isAdmin && !isSharedEditor) {
        throw new ForbiddenException('Access denied');
      }
      const updateProject = await this.projectModel.findByIdAndUpdate(
        projectId,
        update,
        {
          new: true,
        },
      );
      if (!updateProject) {
        throw new NotFoundException('Project not found after update');
      }
      return updateProject;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  // Find all projects owned by a user with optional search, pagination
  async findAll(
    ownerId: string,
    page = 1,
    limit = 10,
    search = '',
  ): Promise<ProjectPaginationResult> {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to fetch projects',
      );
    }
  }

  // Share a project with another user by ID and assign permissions
  async shareProject(sharedProject: ShareProjectDto): Promise<Project> {
    try {
      const project = await this.projectModel.findById(sharedProject.projectId);
      if (!project) throw new NotFoundException('Project not found');
      project.sharedWith.push({
        user: new Types.ObjectId(sharedProject.userId),
        permissions: sharedProject.permissions,
      });
      return await project.save();
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to share project');
    }
  }

  async findAllProjectsForAdmin(
    page = 1,
    limit = 10,
    search = '',
  ): Promise<ProjectPaginationResult> {
    try {
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
    } catch {
      throw new InternalServerErrorException('Failed to fetch all projects');
    }
  }

  async transferOwnership(
    projectId: string,
    dto: TransferOwnerDto,
  ): Promise<Project> {
    try {
      const project = await this.projectModel.findById(projectId);
      if (!project) throw new NotFoundException('Project not found');

      project.owner = new Types.ObjectId(dto.newOwnerId);
      return await project.save();
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to transfer ownership',
      );
    }
  }

  async shareProjectWithUser(
    projectId: string,
    shareDto: updateShareProjectDto,
  ): Promise<Project> {
    try {
      const project = await this.projectModel.findById(projectId);
      if (!project) throw new NotFoundException('Project not found');

      const existing = project.sharedWith.find(
        (entry) => entry.user.toString() === shareDto.userId,
      );

      if (existing) {
        existing.permissions = shareDto.permissions;
      } else {
        project.sharedWith.push({
          user: new Types.ObjectId(shareDto.userId),
          permissions: shareDto.permissions,
        });
      }

      return await project.save();
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Failed to share project',
      );
    }
  }

  async findByTag(tag: string): Promise<Project[]> {
    try {
      return await this.projectModel
        .find({ tags: tag })
        .populate('owner', 'name email')
        .exec();
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Failed to fetch projects by tag',
      );
    }
  }
}
